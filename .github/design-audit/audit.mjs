// One-off audit of the phone pass. PR and MAIN are two builds of the same site, served the same way by serve.mjs with
// the API's answers fixed. For the PR's build it records, in <OUT>/report.md and report.json and before any gate
// decides, what the pass promises:
//   - acceptance 4: every page x 360/390/430 x light/dark, and the open menu: sideways overflow, text under 12 px and
//     axe's color-contrast, target-size, link-name and button-name; a full-page shot of each (phone-*.png);
//   - acceptance 2: a rest and a down shot for each family of controls at 390 in both themes, in a context that cannot
//     hover (pressed-*.png);
//   - acceptance 3: WebKit's iPhone profiles in portrait and landscape (webkit-*.png) with the env() probe, then the
//     same shots with iPhone 13's insets set on <html> (simulated-insets-*.png);
//   - acceptance 6: / and a project page at 1440, light and dark, on both builds, compared pixel for pixel by
//     compare.mjs; the gate is 0 differing pixels;
//   - Build 3: shots of each changed item at 360 and 390 on main (before) and on the PR (after) (b3-*.png), and one shot
//     of the rail alternative to the timeline's bands, from a stylesheet injected into the PR's build.
// The gates fail the job, but only after every check has written its rows.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, webkit } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.OUT || join(HERE, "out"));
const PR_ROOT = resolve(process.env.PR_ROOT || join(HERE, "..", ".."));
const PR = (process.env.PR || "http://localhost:4180").replace(/\/+$/, "");
const MAIN = (process.env.MAIN || "http://localhost:4181").replace(/\/+$/, "");
const out = (name) => join(OUT, name);

const AXE_DIR = dirname(createRequire(import.meta.url).resolve("axe-core"));
const AXE = readFileSync(join(AXE_DIR, existsSync(join(AXE_DIR, "axe.min.js")) ? "axe.min.js" : "axe.js"), "utf8");
const AXE_RULES = ["color-contrast", "target-size", "link-name", "button-name"];

const PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const WIDTHS = [360, 390, 430];
const THEMES = ["light", "dark"];
const phone = (width, height = 800) => ({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA });
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: DESKTOP_UA };
const LANDSCAPE_844 = { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA };
const IPHONE = devices["iPhone 13"];
const IPHONE_LANDSCAPE = devices["iPhone 13 landscape"];
// A missing descriptor would spread to nothing and shoot at the default desktop size under a phone's name.
if (!IPHONE || !IPHONE_LANDSCAPE) throw new Error("this Playwright has no iPhone 13 device descriptors");

// iPhone 13's insets in CSS px: portrait top 47 and bottom 34; landscape left and right 47 and bottom 21.
const INSETS = {
  portrait: { "--safe-top": "47px", "--safe-bottom": "34px" },
  landscape: { "--safe-left": "47px", "--safe-right": "47px", "--safe-bottom": "21px" },
};

const CHUNK = 6000; // CSS px per full-page shot; a longer page is shot in parts
const MAX_PARTS = 5;
// What a page shows while it loads: the home, projects, project and repo-stats placeholders, and the README's.
const LOADING = '[role="status"][aria-label^="Loading"], .github-readme.loading, .readme-fallback';
const SPOTIFY = /\/\/open\.spotify\.com\//;
const INSIGHTS = /\/_vercel\/(insights|speed-insights)\//;
const FIXTURE_PATH = "/projects/phone-fixture";
const CLAUDFATHER = "/projects/claudfather";

const HOLDS = [
  "the API is serve.mjs's fixed JSON on both builds (/api/features, the repo and README answers; every other /api/* is a 404)",
  "open.spotify.com and /_vercel/insights/ requests are aborted (no third-party player, no analytics script)",
  "Math.random() is 0 (the home page picks its hero photo at random)",
  "prefers-reduced-motion: reduce (entrance motion off)",
  "before any shot: networkidle, document.fonts.ready, the headline shown and no loading placeholder left",
];

// The rail alternative to the timeline's bands: injected after the page has loaded, never shipped.
const RAIL_CSS = `/* Rail alternative: one shot for the PR; the site never loads this. */
@media (max-width: 480px) {
  /* The rail: 2 px wide (Timeline.css:25), centred by its translateX(-50%) (:27).
     The track's padding box starts at the gutter, x = 16, so left: -10px puts the
     centre at x = 6: the rail spans 5..7. */
  .timeline-line {
    display: block;
    left: -0.625rem;
  }
  /* The dot: 8 px, centred on the rail (x = 6, spanning 2..10), so 6 px clear of
     the text at 16. 2 px border (:63) in the entry's type colour (:81-87);
     the 4 px hole shows the card background (:62). top centres it on the first
     text line: the card's padding-top 12 px + half a 19.2 px line - 4 px. */
  .timeline-dot {
    display: flex;
    left: -0.625rem;
    top: 1.1rem;
    width: 0.5rem;
    height: 0.5rem;
  }
  /* Nothing fits an 8 px dot: not the 28 px logo, not the emoji. */
  .timeline-dot > * {
    display: none;
  }
  /* The card's chrome goes: no fill, no hairlines, the text block alone. The
     band's margin and padding stay, so the text stays at x = 16. */
  .timeline-entry .timeline-card {
    background-color: transparent;
    border: 0;
  }
}
`;

const slug = (path) => (path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase());
const oneLine = (text, length) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, length);
const decode = (text) => text.replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const report = {
  startedAt: new Date().toISOString(),
  pr: { url: PR, sha: process.env.PR_SHA || null },
  main: { url: MAIN, sha: process.env.MAIN_SHA || null },
  browsers: {},
  pages: [],
  standard: null,
  matrix: [],
  menus: [],
  pressed: { rows: [] },
  webkit: {},
  simulated: [],
  compare: [],
  b3: [],
  rail: null,
  files: [],
  gates: [],
  errors: [],
};

/* The pages of the audit: the sitemap the build wrote lists exactly the pages a visitor can land on. */
let PAGES = ["/", "/projects"];
let STANDARD = "/projects/storydump";

/* Runs one step of a phase; a failure is recorded and the rest carries on. */
async function attempt(label, fn) {
  try {
    return await fn();
  } catch (error) {
    report.errors.push({ where: label, error: oneLine(error?.stack || error, 500) });
    console.log(`error in ${label}: ${oneLine(error, 240)}`);
    return undefined;
  }
}

async function shot(page, name, options = {}) {
  const buffer = await page.screenshot({ path: out(name), ...options });
  report.files.push(name);
  return buffer;
}

/* The whole page as one shot, or in parts when it is taller than a shot can be at this scale. */
async function fullPageShots(page, base, width) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  if (height <= CHUNK) {
    await shot(page, `${base}.png`, { fullPage: true });
    return [`${base}.png`];
  }
  const names = [];
  for (let y = 0, part = 1; y < height && part <= MAX_PARTS; y += CHUNK, part++) {
    const name = `${base}-part${part}.png`;
    await shot(page, name, { fullPage: true, clip: { x: 0, y, width, height: Math.min(CHUNK, height - y) } });
    names.push(name);
  }
  return names;
}

/* A shot of one element's rows of the page at the screen's full width, so a card bleeding through the gutter, or a rail
   in it, is whole. The page is at its top, so a sticky header stays out of the region. */
async function regionShot(page, selector, name, pad = 0) {
  const region = await page.locator(selector).first().evaluate((el) => {
    const box = el.getBoundingClientRect();
    return { top: box.top + window.scrollY, height: box.height };
  });
  const top = Math.max(0, Math.floor(region.top - pad));
  await shot(page, name, { fullPage: true, clip: { x: 0, y: top, width: page.viewportSize().width, height: Math.ceil(region.height + 2 * pad) } });
}

/* A context with the page held still (HOLDS) in the given theme; `insets` are custom properties set on <html>. */
async function openContext(browser, options, theme = "light", insets = null) {
  const context = await browser.newContext({ ...options, colorScheme: theme, reducedMotion: "reduce" });
  context.setDefaultTimeout(30000);
  await context.addInitScript(() => {
    Math.random = () => 0;
  });
  // The site opens in light whatever the OS prefers; dark is the theme a visitor picks with the toggle, which the
  // store saves as ui-storage in localStorage, so a dark load starts with that saved choice.
  if (theme === "dark") {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("ui-storage", JSON.stringify({ state: { theme: "dark" }, version: 0 }));
      } catch {
        // storage blocked: the page stays in its default theme, which the shots show
      }
    });
  }
  if (insets) {
    await context.addInitScript((values) => {
      for (const [name, value] of Object.entries(values)) document.documentElement.style.setProperty(name, value);
    }, insets);
  }
  await context.route(SPOTIFY, (route) => route.abort());
  await context.route(INSIGHTS, (route) => route.abort());
  return context;
}

async function open(browser, options, theme, insets) {
  const context = await openContext(browser, options, theme, insets);
  return { context, page: await context.newPage() };
}

/* Waits until the page is what a visitor sees: loaded, quiet, in its fonts, with its headline and no placeholder. */
async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await page.waitForFunction((selector) => !document.querySelector(selector), LOADING, { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
  }).catch(() => {});
  await page.waitForTimeout(300);
}

/* Scrolls through the page once so lazy images and in-view content load, then back to the top. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.evaluate(async () => {
    const pending = [...document.images].filter((image) => !image.complete);
    await Promise.race([
      Promise.all(
        pending.map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
        ),
      ),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  });
  await settle(page);
}

const toTop = async (page) => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
};
const toBottom = async (page) => {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(300);
};

async function openMenu(page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("dialog.mobile-menu[open]").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
}

async function withAxe(page) {
  if (!(await page.evaluate(() => typeof window.axe !== "undefined"))) await page.addScriptTag({ content: AXE });
}

/* Runs in the page: sideways overflow, the elements that stick out of the screen, and text under 12 px. The layout
   clips sideways overflow (overflow-x: clip), so the scroll width alone cannot see it; sticksOut lists what lies
   outside the screen and is not inside a scroller. */
function inspect(rootSelector) {
  const width = document.documentElement.clientWidth;
  const root = (rootSelector && document.querySelector(rootSelector)) || document.body;
  const name = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const classes = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 4) : [];
    return `${el.tagName.toLowerCase()}${id}${classes.length ? `.${classes.join(".")}` : ""}`;
  };
  const shown = (el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const box = el.getBoundingClientRect();
    return box.width > 1 && box.height > 1;
  };
  const inScroller = (el) => {
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const overflow = getComputedStyle(parent).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
    return false;
  };

  const overflowPx = document.documentElement.scrollWidth - width;
  const rootOverflowPx = root === document.body ? 0 : root.scrollWidth - root.clientWidth;

  const sticksOut = [];
  for (const el of root.querySelectorAll("*")) {
    if (sticksOut.length >= 8) break;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1 || (box.right <= width + 1 && box.left >= -1)) continue;
    if (!shown(el) || inScroller(el)) continue;
    const parent = el.parentElement && el.parentElement.getBoundingClientRect();
    if (parent && (parent.right > width + 1 || parent.left < -1)) continue; // only the outermost element that sticks out
    sticksOut.push({ el: name(el), left: Math.round(box.left), right: Math.round(box.right), text: (el.innerText || "").trim().slice(0, 60) });
  }

  const smallText = [];
  const seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    const el = walker.currentNode.parentElement;
    if (!text || !el || seen.has(el)) continue;
    seen.add(el);
    if (!shown(el)) continue;
    const px = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    if (px < 12 && smallText.length < 15) smallText.push({ px, el: name(el), text: text.slice(0, 60) });
  }
  return { height: document.documentElement.scrollHeight, width, overflowPx, rootOverflowPx, sticksOut, smallText };
}

/* Runs in the page once axe-core is loaded: the four rules of the acceptance, on the page or on one element. */
async function runAxe(rootSelector) {
  const root = (rootSelector && document.querySelector(rootSelector)) || document;
  const result = await window.axe.run(root, {
    runOnly: { type: "rule", values: ["color-contrast", "target-size", "link-name", "button-name"] },
    resultTypes: ["violations", "incomplete"],
  });
  const nodes = (rule) =>
    rule.nodes.slice(0, 10).map((node) => {
      const data = (node.any && node.any[0] && node.any[0].data) || {};
      return {
        target: node.target.join(" "),
        html: node.html.slice(0, 140),
        ratio: data.contrastRatio,
        expected: data.expectedContrastRatio,
        fontSize: data.fontSize,
        summary: (node.failureSummary || "").slice(0, 200),
      };
    });
  return {
    violations: result.violations.map((rule) => ({ id: rule.id, impact: rule.impact, count: rule.nodes.length, nodes: nodes(rule) })),
    incomplete: result.incomplete.map((rule) => ({ id: rule.id, count: rule.nodes.length })),
  };
}

/* The row of acceptance 4 for what `inspect` and `runAxe` saw. */
function rowOf(row, dom, axe) {
  row.height = dom.height;
  row.overflowPx = dom.overflowPx;
  row.rootOverflowPx = dom.rootOverflowPx;
  row.sticksOut = dom.sticksOut;
  row.smallText = dom.smallText;
  row.axe = Object.fromEntries(AXE_RULES.map((id) => [id, axe.violations.find((violation) => violation.id === id)?.count ?? 0]));
  row.axeNodes = axe.violations.flatMap((violation) => violation.nodes.slice(0, 4).map((node) => ({ rule: violation.id, ...node })));
  row.incomplete = Object.fromEntries(axe.incomplete.map((rule) => [rule.id, rule.count]));
  row.pass = row.status === 200 && row.overflowPx <= 0 && row.rootOverflowPx <= 0 && row.smallText.length === 0 && Object.values(row.axe).every((count) => count === 0);
  return row;
}

async function checkPage(context, path, width, theme) {
  const row = { path, width, theme, files: [] };
  const page = await context.newPage();
  try {
    const response = await page.goto(PR + path, { waitUntil: "load", timeout: 60000 });
    row.status = response ? response.status() : null;
    await settle(page);
    await scrollThrough(page);
    const dom = await page.evaluate(inspect, null);
    await withAxe(page);
    const axe = await page.evaluate(runAxe, null);
    rowOf(row, dom, axe);
    row.files = await fullPageShots(page, `phone-${width}-${theme}-${slug(path)}`, width);
  } catch (error) {
    row.error = oneLine(error, 300);
    row.pass = false;
  } finally {
    await page.close().catch(() => {});
  }
  return row;
}

/* The same checks inside the open mobile menu, at /. */
async function checkMenu(context, width, theme) {
  const row = { path: "menu (/)", width, theme, files: [] };
  const page = await context.newPage();
  try {
    const response = await page.goto(PR + "/", { waitUntil: "load", timeout: 60000 });
    row.status = response ? response.status() : null;
    await settle(page);
    await openMenu(page);
    const dom = await page.evaluate(inspect, "dialog.mobile-menu");
    await withAxe(page);
    const axe = await page.evaluate(runAxe, "dialog.mobile-menu");
    rowOf(row, dom, axe);
    await shot(page, `phone-${width}-${theme}-menu.png`);
    row.files = [`phone-${width}-${theme}-menu.png`];
  } catch (error) {
    row.error = oneLine(error, 300);
    row.pass = false;
  } finally {
    await page.close().catch(() => {});
  }
  return row;
}

async function acceptance4(browser) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const context = await openContext(browser, phone(width), theme);
      try {
        for (const path of PAGES) {
          console.log(`acceptance 4: ${path} ${width} ${theme}`);
          report.matrix.push(await checkPage(context, path, width, theme));
        }
        console.log(`acceptance 4: menu ${width} ${theme}`);
        report.menus.push(await checkMenu(context, width, theme));
      } finally {
        await context.close();
      }
      await flush(); // a long phase leaves its rows behind if the step is cut short
    }
  }
}

/* The GitHub account whose repos the site shows, from site.yaml: the fixture project's repo must be one the API serves. */
function githubOwner() {
  const yaml = createRequire(join(PR_ROOT, "frontend", "package.json"))("js-yaml");
  const site = yaml.load(readFileSync(join(PR_ROOT, "site", "site.yaml"), "utf8"));
  return site.github.username;
}

/* A project page with every control a standard project page can show, as the spec's fixture has: a repo, a demo that
   differs from the url, a README. The static server answers the unknown slug with 404.html, the app shell, which
   renders the route once the routed project list arrives. */
async function routeFixture(page) {
  const owner = githubOwner();
  await page.route("**/content/projects/index.yaml", (route) => route.fulfill({ json: { projects: ["phone-fixture.yaml"] } }));
  await page.route("**/content/projects/phone-fixture.yaml", (route) =>
    route.fulfill({
      json: {
        id: "phone-fixture",
        title: "Phone fixture",
        description: "A fixture.",
        icon: "📱",
        category: "web-app",
        url: `https://github.com/${owner}/phone-fixture`,
        demo: "https://demo.example.org/",
        technologies: ["TypeScript"],
      },
    }),
  );
  await page.route("https://demo.example.org/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>demo</title><p>A demo.</p>" }),
  );
}

/* The box of `locator` grown by `pad` and kept inside the screen. */
async function clipAround(page, locator, pad) {
  const box = await locator.boundingBox();
  const screen = page.viewportSize();
  const x = Math.max(0, Math.floor(box.x - pad));
  const y = Math.max(0, Math.floor(box.y - pad));
  return {
    x,
    y,
    width: Math.min(screen.width, Math.ceil(box.x + box.width + pad)) - x,
    height: Math.min(screen.height, Math.ceil(box.y + box.height + pad)) - y,
  };
}

// One control per family of the pressed state. `frame` is the box the shot shows where it is wider than the control.
const FAMILIES = [
  { name: "filled", path: "/", target: (page) => page.locator(".home-hero .btn-primary").first() },
  { name: "ghost", path: "/", target: (page) => page.locator(".home-hero .btn-ghost").first() },
  { name: "icon", path: "/", target: (page) => page.locator("button.nav-hamburger") },
  { name: "text", path: "/", prepare: openMenu, target: (page) => page.locator("dialog.mobile-menu .mobile-menu-link").first() },
  {
    name: "row",
    path: "/projects",
    target: (page) => page.locator("a.project-row-link").first(),
    frame: (target) => target.locator("xpath=ancestor::li[contains(@class, 'project-row')][1]"),
  },
  { name: "accent", path: "/", target: (page) => page.locator("#projects .page-links a").first() },
  { name: "demo", path: FIXTURE_PATH, fixture: true, target: (page) => page.locator(".demo-fullscreen-btn") },
  { name: "cf-filled", path: CLAUDFATHER, target: (page) => page.locator(".cl-hero .btn-primary").first() },
  { name: "cf-ghost", path: CLAUDFATHER, target: (page) => page.locator(".cl-hero .btn-ghost").first() },
];

/* The control at rest, then under a held press that ends away from it, so nothing is clicked. */
async function pressedPair(browser, family, theme) {
  const base = `pressed-${family.name}-${theme}`;
  const row = { family: family.name, theme, rest: `${base}-rest.png`, down: `${base}-down.png` };
  const { context, page } = await open(browser, phone(390), theme);
  try {
    // A link dragged off its box would be dropped as a navigation; the press is not a drag.
    await context.addInitScript(() => document.addEventListener("dragstart", (event) => event.preventDefault(), true));
    if (family.fixture) await routeFixture(page);
    await page.goto(PR + family.path, { waitUntil: "load", timeout: 60000 });
    await settle(page);
    row.hoverNone = await page.evaluate(() => matchMedia("(hover: none)").matches);
    if (family.prepare) await family.prepare(page);
    const target = family.target(page);
    await target.waitFor({ state: "visible", timeout: 10000 });
    await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(250);
    const clip = await clipAround(page, family.frame ? family.frame(target) : target, 24);
    const box = await target.boundingBox();
    await page.mouse.move(0, 0);
    const rest = await shot(page, row.rest, { clip });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150);
    const down = await shot(page, row.down, { clip });
    await page.mouse.move(0, 0);
    await page.mouse.up();
    row.changed = !rest.equals(down);
  } catch (error) {
    row.error = oneLine(error, 300);
  } finally {
    await context.close();
  }
  return row;
}

async function pressedPhase(browser) {
  for (const family of FAMILIES) {
    for (const theme of THEMES) {
      if (family.path === CLAUDFATHER && !PAGES.includes(CLAUDFATHER)) {
        report.pressed.rows.push({ family: family.name, theme, error: "the site lists no Claudfather page" });
        continue;
      }
      console.log(`pressed: ${family.name} ${theme}`);
      report.pressed.rows.push(await pressedPair(browser, family, theme));
    }
    await flush();
  }
  report.pressed.premise = report.pressed.rows.find((row) => row.hoverNone !== undefined)?.hoverNone ?? null;
}

/* The four paddings of a fixed box set to env(safe-area-inset-*) with a 7px fallback: 0px each where the engine
   supports env() and reports no inset, 7px where it does not support env() at all. */
const envProbe = (page) =>
  page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;padding:env(safe-area-inset-top,7px) env(safe-area-inset-right,7px) env(safe-area-inset-bottom,7px) env(safe-area-inset-left,7px)";
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const sides = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    probe.remove();
    return sides;
  });

/* What the page's CSS made of the insets in force. */
const readInsets = (page) =>
  page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const read = (selector, property) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el)[property] : null;
    };
    return {
      safeTop: root.getPropertyValue("--safe-top").trim(),
      safeRight: root.getPropertyValue("--safe-right").trim(),
      safeBottom: root.getPropertyValue("--safe-bottom").trim(),
      safeLeft: root.getPropertyValue("--safe-left").trim(),
      headerPaddingTop: read("header.compact-header", "paddingTop"),
      mainPaddingLeft: read("main.layout-main", "paddingLeft"),
      footerPaddingBottom: read("footer.footer", "paddingBottom"),
    };
  });

/* The device shots of acceptance 3: the screen at the top of /, at the foot of /, the open menu (and its end), /projects,
   and a project page at its README. */
async function deviceShots(page, prefix, { menu, readings }) {
  await attempt(`${prefix} home`, async () => {
    await page.goto(PR + "/", { waitUntil: "load", timeout: 60000 });
    await settle(page);
    if (readings) report.simulated.push({ prefix, ...(await readInsets(page)) });
    await shot(page, `${prefix}-home.png`);
  });
  await attempt(`${prefix} footer`, async () => {
    await toBottom(page);
    await shot(page, `${prefix}-footer.png`);
  });
  if (menu) {
    await attempt(`${prefix} menu`, async () => {
      await toTop(page);
      await openMenu(page);
      await shot(page, `${prefix}-menu.png`);
      await page.locator(".mobile-menu-content").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(250);
      await shot(page, `${prefix}-menu-end.png`);
    });
  }
  await attempt(`${prefix} projects`, async () => {
    await page.goto(PR + "/projects", { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await shot(page, `${prefix}-projects.png`);
  });
  await attempt(`${prefix} readme`, async () => {
    await page.goto(PR + STANDARD, { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await page.evaluate(() => document.querySelector("#readme")?.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.waitForTimeout(300);
    await shot(page, `${prefix}-readme.png`);
  });
}

async function webkitPhase(wk, cr) {
  if (!wk) {
    report.errors.push({ where: "webkit", error: "WebKit did not start; no WebKit shots and no env() probe" });
    return;
  }
  // WebKit's iPhone profiles as they are: the notch and the home bar are not drawn and every inset reads 0.
  for (const [prefix, options, menu] of [
    ["webkit-portrait", IPHONE, true],
    ["webkit-landscape", IPHONE_LANDSCAPE, false],
  ]) {
    const { context, page } = await open(wk, options, "light");
    try {
      await attempt(`${prefix} env probe`, async () => {
        await page.goto(PR + "/", { waitUntil: "load", timeout: 60000 });
        await settle(page);
        const sides = await envProbe(page);
        if (menu) report.webkit.probe = sides;
        else report.webkit.probeLandscape = sides;
      });
      await deviceShots(page, prefix, { menu, readings: false });
    } finally {
      await context.close();
    }
  }
  // The same shots with iPhone 13's insets put on <html>: what the CSS does when the insets are not 0.
  for (const [prefix, browser, options, insets, menu] of [
    ["simulated-insets-portrait", wk, IPHONE, INSETS.portrait, true],
    ["simulated-insets-landscape-844", cr, LANDSCAPE_844, INSETS.landscape, false],
    ["simulated-insets-landscape-750", wk, IPHONE_LANDSCAPE, INSETS.landscape, false],
  ]) {
    const { context, page } = await open(browser, options, "light", insets);
    try {
      await deviceShots(page, prefix, { menu, readings: true });
    } finally {
      await context.close();
    }
  }
}

async function comparePhase(browser) {
  await mkdir(out("compare-src"), { recursive: true });
  const pairs = [];
  for (const path of ["/", STANDARD]) {
    for (const theme of THEMES) {
      const pair = { page: slug(path), theme };
      for (const [side, base] of [
        ["main", MAIN],
        ["pr", PR],
      ]) {
        await attempt(`compare ${path} ${theme} ${side}`, async () => {
          const { context, page } = await open(browser, DESKTOP, theme);
          try {
            await page.goto(base + path, { waitUntil: "load", timeout: 60000 });
            await settle(page);
            await scrollThrough(page);
            await page.mouse.move(0, 0);
            await page.waitForTimeout(300);
            const name = `compare-src/${pair.page}-${theme}-${side}.png`;
            await shot(page, name, { fullPage: true });
            pair[side] = name;
          } finally {
            await context.close();
          }
        });
      }
      pairs.push(pair);
    }
  }
  await writeFile(out("compare-src/pairs.json"), JSON.stringify(pairs, null, 2));
  spawnSync(process.execPath, [join(HERE, "compare.mjs")], { stdio: "inherit", env: { ...process.env, OUT } });
  report.compare = JSON.parse(await readFile(out("compare.json"), "utf8"));
  for (const result of report.compare) if (result.pass !== undefined && result.differing !== null) report.files.push(result.diff);
}

// Build 3: what changes on a phone. A region is the element's rows at the screen's width; "home" is the whole page.
const B3 = [
  { item: "journey", path: "/", region: "#journey", themes: ["light", "dark"] },
  { item: "readme", path: () => STANDARD, region: "#readme", themes: ["light", "dark"] },
  { item: "repository", path: () => STANDARD, region: "#repository", themes: ["light"] },
  { item: "actions", path: "/", region: "#about .action-buttons", pad: 24, themes: ["light"] },
  { item: "home", path: "/", region: null, themes: ["light"] },
];

async function beforeAfterPhase(browser) {
  for (const width of [360, 390]) {
    for (const theme of THEMES) {
      for (const [side, base] of [
        ["before", MAIN],
        ["after", PR],
      ]) {
        const items = B3.filter((entry) => entry.themes.includes(theme)).map((entry) => ({ ...entry, path: typeof entry.path === "function" ? entry.path() : entry.path }));
        const { context, page } = await open(browser, phone(width), theme);
        try {
          for (const path of [...new Set(items.map((entry) => entry.path))]) {
            console.log(`b3: ${path} ${width} ${theme} ${side}`);
            const loaded = await attempt(`b3 ${path} ${width} ${theme} ${side}`, async () => {
              await page.goto(base + path, { waitUntil: "load", timeout: 60000 });
              await settle(page);
              await scrollThrough(page);
              return true;
            });
            if (!loaded) continue;
            for (const entry of items.filter((candidate) => candidate.path === path)) {
              await attempt(`b3 ${entry.item} ${width} ${theme} ${side}`, async () => {
                const stem = `b3-${entry.item}-${width}-${theme}-${side}`;
                let files = [`${stem}.png`];
                if (entry.region) await regionShot(page, entry.region, files[0], entry.pad ?? 0);
                else files = await fullPageShots(page, stem, width);
                report.b3.push({ item: entry.item, width, theme, side, files });
              });
            }
          }
        } finally {
          await context.close();
        }
      }
    }
  }
}

async function railPhase(browser) {
  const { context, page } = await open(browser, phone(390), "light");
  try {
    await page.goto(PR + "/", { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await scrollThrough(page);
    await page.addStyleTag({ content: RAIL_CSS });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    await page.waitForTimeout(300);
    await regionShot(page, "#journey", "alt-timeline-rail-390-light.png");
    report.rail = "alt-timeline-rail-390-light.png";
  } finally {
    await context.close();
  }
}

/* The sitemap the build wrote lists the pages a visitor can land on, so there is no crawl. */
async function pagesPhase() {
  const xml = await readFile(join(PR_ROOT, "frontend", "dist", "sitemap.xml"), "utf8");
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(decode(match[1])).pathname.replace(/\/+$/, "") || "/");
  PAGES = [...new Set(["/", "/projects", ...paths])];
  const standard = PAGES.includes("/projects/storydump") ? "/projects/storydump" : PAGES.find((path) => path.startsWith("/projects/") && path !== CLAUDFATHER);
  if (standard) STANDARD = standard;
  report.pages = PAGES;
  report.standard = STANDARD;
}

const cell = (value) => String(value ?? "").replace(/\|/g, "\\|");
const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)];

function render() {
  const lines = ["# Phone pass audit", ""];
  lines.push(`Started ${report.startedAt}. Chromium ${report.browsers.chromium ?? "n/a"}, WebKit ${report.browsers.webkit ?? "n/a"}.`);
  lines.push(`PR build: ${report.pr.url} at ${report.pr.sha ?? "an unknown commit"}. Main build: ${report.main.url} at ${report.main.sha ?? "an unknown commit"}.`, "");
  lines.push("Held still on every page:", ...HOLDS.map((hold) => `- ${hold}`), "");

  lines.push("## Gates", "");
  lines.push(...(report.gates.length > 0 ? report.gates.map((gate) => `- ${gate.pass ? "PASS" : "FAIL"}: ${gate.name} (${gate.detail})`) : ["- none decided yet"]), "");

  const rows = [...report.matrix, ...report.menus];
  const failing = rows.filter((row) => !row.pass);
  lines.push("## Acceptance 4: overflow, type size, axe (the PR's build)", "");
  lines.push(
    `${rows.length - failing.length} of ${rows.length} rows pass: every page (${report.pages.join(", ")}) at 360, 390 and 430 in both themes, and the open menu. A row passes on a 200, no sideways scroll width, no text under 12 px and no axe violation of ${AXE_RULES.join(", ")}. "sticks out" counts elements lying outside the screen that are not inside a scroller (informational: the layout clips sideways overflow, so the scroll width cannot see it).`,
    "",
  );
  lines.push(
    ...table(
      ["page", "width", "theme", "status", "overflow px", "sticks out", "text under 12px", ...AXE_RULES, "result"],
      rows.map((row) => [
        row.path,
        row.width,
        row.theme,
        row.status ?? "",
        row.error ? "error" : `${row.overflowPx}${row.rootOverflowPx ? ` (+${row.rootOverflowPx} in the menu)` : ""}`,
        row.sticksOut?.length ?? "",
        row.smallText?.length ?? "",
        ...AXE_RULES.map((id) => row.axe?.[id] ?? ""),
        row.pass ? "pass" : "FAIL",
      ]),
    ),
    "",
  );
  for (const row of failing) {
    lines.push(`### ${row.path} ${row.width} ${row.theme}`);
    if (row.error) lines.push(`- error: ${row.error}`);
    if (row.status !== undefined && row.status !== 200) lines.push(`- status ${row.status}`);
    if (row.overflowPx > 0 || row.rootOverflowPx > 0) lines.push(`- overflow: ${row.overflowPx} px (${row.rootOverflowPx} in the menu)`);
    if (row.smallText?.length) lines.push(`- text under 12px: ${JSON.stringify(row.smallText)}`);
    for (const node of row.axeNodes ?? []) lines.push(`- axe ${node.rule}: ${node.target} ${node.ratio ? `(ratio ${node.ratio}, wants ${node.expected})` : ""} ${node.summary ?? ""}`);
    lines.push("");
  }
  const watched = rows.filter((row) => row.sticksOut?.length);
  if (watched.length > 0) {
    lines.push("Elements lying outside the screen, outside any scroller:", ...watched.map((row) => `- ${row.path} ${row.width} ${row.theme}: ${JSON.stringify(row.sticksOut)}`), "");
  }

  lines.push("## Acceptance 2: the pressed state at 390", "");
  lines.push(`Context that cannot hover (matchMedia("(hover: none)")): ${report.pressed.premise === null ? "not measured" : report.pressed.premise}. "pixels differ" is whether the down shot differs from the rest shot.`, "");
  lines.push(
    ...table(
      ["family", "theme", "rest", "down", "pixels differ", "note"],
      report.pressed.rows.map((row) => [row.family, row.theme, row.rest ?? "", row.down ?? "", row.changed === undefined ? "" : row.changed ? "yes" : "NO", row.error ?? ""]),
    ),
    "",
  );

  lines.push("## Acceptance 3: WebKit's iPhone profiles and simulated insets", "");
  lines.push(report.webkit.probe ? `webkit iPhone insets: ${report.webkit.probe.join(" ")}` : "webkit iPhone insets: not measured", "");
  if (report.webkit.probeLandscape) lines.push(`webkit iPhone landscape insets: ${report.webkit.probeLandscape.join(" ")}`, "");
  lines.push(
    "Insets put on <html> (iPhone 13's: portrait top 47 and bottom 34; landscape left and right 47, bottom 21) and what the page's CSS made of them:",
    "",
    ...table(
      ["set", "--safe-top", "--safe-right", "--safe-bottom", "--safe-left", "header padding-top", "main padding-left", "footer padding-bottom"],
      report.simulated.map((row) => [row.prefix, row.safeTop, row.safeRight, row.safeBottom, row.safeLeft, row.headerPaddingTop, row.mainPaddingLeft, row.footerPaddingBottom]),
    ),
    "",
  );

  lines.push("## Acceptance 6: desktop 1440, main against the PR", "");
  lines.push(
    ...table(
      ["page", "theme", "differing pixels", "result", "diff", "note"],
      report.compare.map((result) => [result.page, result.theme, result.differing ?? "not compared", result.pass ? "pass" : "FAIL", result.differing === null ? "" : result.diff, result.note ?? ""]),
    ),
    "",
  );

  lines.push("## Build 3: before (main) and after (PR)", "");
  const pairs = new Map();
  for (const entry of report.b3) {
    const key = `${entry.item} ${entry.width} ${entry.theme}`;
    pairs.set(key, { ...(pairs.get(key) ?? { item: entry.item, width: entry.width, theme: entry.theme }), [entry.side]: entry.files.join(", ") });
  }
  lines.push(...table(["item", "width", "theme", "before", "after"], [...pairs.values()].map((pair) => [pair.item, pair.width, pair.theme, pair.before ?? "", pair.after ?? ""])), "");
  lines.push(`Rail alternative (rendered once from an injected stylesheet; the site never loads it): ${report.rail ?? "not taken"}, beside b3-journey-390-light-after.png.`, "");

  if (report.errors.length > 0) lines.push("## Errors", "", ...report.errors.map((entry) => `- ${entry.where}: ${entry.error}`), "");

  lines.push("## Files", "", `${report.files.length} shots:`, "", ...report.files.map((file) => `- ${file}`), "");
  return lines.join("\n");
}

async function flush() {
  try {
    await writeFile(out("report.json"), JSON.stringify(report, null, 2));
    await writeFile(out("report.md"), render());
  } catch (error) {
    console.log(`the report could not be written: ${oneLine(error, 300)}`);
  }
}

/* A phase that throws is recorded, and the next one runs; the report is written after each. */
async function phase(name, fn) {
  console.log(`== ${name}`);
  try {
    await fn();
  } catch (error) {
    report.errors.push({ where: name, error: oneLine(error?.stack || error, 600) });
    console.log(`phase ${name} failed: ${oneLine(error, 300)}`);
  }
  await flush();
}

const gate = (name, pass, detail) => report.gates.push({ name, pass, detail });

await mkdir(OUT, { recursive: true });
const chromiumBrowser = await (async () => {
  try {
    return await chromium.launch();
  } catch (error) {
    console.log(`Playwright's Chromium did not start (${oneLine(error, 200)}); using the runner's Chrome`);
    return chromium.launch({ channel: "chrome" });
  }
})();
report.browsers.chromium = chromiumBrowser.version();
let webkitBrowser = null;
try {
  webkitBrowser = await webkit.launch();
  report.browsers.webkit = webkitBrowser.version();
} catch (error) {
  report.errors.push({ where: "webkit launch", error: oneLine(error, 400) });
}

try {
  await phase("pages", pagesPhase);
  await phase("acceptance 4", () => acceptance4(chromiumBrowser));
  await phase("acceptance 2: pressed", () => pressedPhase(chromiumBrowser));
  await phase("acceptance 3: webkit and simulated insets", () => webkitPhase(webkitBrowser, chromiumBrowser));
  await phase("acceptance 6: desktop compare", () => comparePhase(chromiumBrowser));
  await phase("build 3: before and after", () => beforeAfterPhase(chromiumBrowser));
  await phase("rail alternative", () => railPhase(chromiumBrowser));
} finally {
  await chromiumBrowser.close();
  if (webkitBrowser) await webkitBrowser.close();
}

const rows = [...report.matrix, ...report.menus];
const expectedRows = PAGES.length * WIDTHS.length * THEMES.length + WIDTHS.length * THEMES.length;
const failing = rows.filter((row) => !row.pass);
gate(
  "Acceptance 4: no sideways overflow, no text under 12 px, axe's four rules clean",
  report.pages.length > 0 && rows.length === expectedRows && failing.length === 0,
  report.pages.length === 0
    ? "the page list could not be read from the sitemap"
    : `${rows.length - failing.length} of ${rows.length} rows pass${rows.length === expectedRows ? "" : `, ${expectedRows} expected`}`,
);
const differing = report.compare.filter((result) => !result.pass);
gate(
  "Acceptance 6: / and a project page at 1440 are identical on main and the PR",
  report.compare.length === 4 && differing.length === 0,
  report.compare.length === 0 ? "no comparison was made" : report.compare.map((result) => `${result.page} ${result.theme}: ${result.differing ?? "not compared"}`).join("; "),
);
await flush();
const verdicts = report.gates.map((entry) => `- ${entry.pass ? "PASS" : "FAIL"}: ${entry.name} (${entry.detail})`);
console.log(verdicts.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, ["", "## Audit gates", "", ...verdicts, ""].join("\n"));
process.exitCode = report.gates.every((entry) => entry.pass) ? 0 : 1;
