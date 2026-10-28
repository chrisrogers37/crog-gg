import type { Locator, Page } from "@playwright/test";
import type { ReadmeResponse, Repository } from "../src/services/githubService";
import { test, expect } from "./fixtures";
import { SECTIONS, SUMMON, site } from "./site";

/**
 * Phone E2E Tests: what a thumb needs from the pages.
 *
 * Philosophy: structure and behaviour, found by role and by the classes the
 * code owns, never by the site's copy. A project page comes from a routed
 * fixture project (routeFixtureProject), so both sites show every control a
 * standard project page can.
 *
 * - sizes: every control a visitor taps is a 44px target.
 * - left edges: the journey's and a README's text start on the page's gutter,
 *   level with the headings.
 * - pressed: a control on a screen that can't hover shows that it is pressed,
 *   with no underline, and shows nothing for a hover.
 * - insets: the layout keeps clear of the notch and the home bar.
 * - env probe: what WebKit's iPhone profile reports for those insets.
 * - labels: SUMMON's labels sit on one line.
 *
 * The chromium project runs every group at the widths named. The webkit
 * project (an iPhone 13, 390px wide) runs sizes, left edges and the env probe
 * at its own width: a device profile is never resized.
 */

/** The widths phones are measured at; the iPhone profile is the middle one. */
const WIDTHS = [360, 390, 430] as const;
const IPHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const NOT_RESIZED = "the iPhone profile is 390 wide; the other widths run in Chromium";

/**
 * A phone-sized page with reduced motion, so the menu and the journey are where
 * they end up at once. A device profile keeps its own size.
 */
async function phoneAt(page: Page, width: number, isMobile: boolean) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (!isMobile) await page.setViewportSize({ width, height: PHONE_HEIGHT });
}

/** GitHub's answer for a README, as the API passes it through. */
const readmeAnswer = (text: string): ReadmeResponse => ({
  content: Buffer.from(text).toString("base64"),
  encoding: "base64",
  sha: "0",
  html_url: "https://github.com/someone/example/blob/main/README.md",
  download_url: "https://raw.githubusercontent.com/someone/example/main/README.md",
});

const FIXTURE = "phone-fixture";

/**
 * Routes a standard project page with everything it can show: a repo the API
 * serves (the site's own GitHub owner, so either site serves it), its figures
 * and README, and a live demo that differs from its link.
 */
async function routeFixtureProject(page: Page) {
  await page.route("**/content/projects/index.yaml", (route) =>
    route.fulfill({ json: { projects: [`${FIXTURE}.yaml`] } }),
  );
  await page.route(`**/content/projects/${FIXTURE}.yaml`, (route) =>
    route.fulfill({
      json: {
        id: FIXTURE,
        title: "Phone fixture",
        description: "A fixture.",
        icon: "📱",
        category: "web-app",
        url: `https://github.com/${site.github.username}/${FIXTURE}`,
        demo: "https://demo.example.org/",
        technologies: ["TypeScript"],
      },
    }),
  );
  await page.route("**/api/v1/github/repo/**", (route) =>
    route.fulfill({
      json: {
        stargazers_count: 12,
        forks_count: 3,
        watchers_count: 12,
        open_issues_count: 1,
        language: "TypeScript",
        license: { name: "MIT License", spdx_id: "MIT" },
        pushed_at: "2026-09-30T12:00:00Z",
        topics: [],
      } satisfies Partial<Repository>,
    }),
  );
  await page.route("**/api/v1/github/readme/**", (route) =>
    route.fulfill({ json: readmeAnswer("# A README\n\nA paragraph of text.") }),
  );
  await page.route("https://demo.example.org/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>A demo.</p>" }),
  );
}

/** The mobile menu, open (the panel has slid in when this returns). */
async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(menu).toBeVisible();
  await menu.evaluate((el) =>
    Promise.all(el.getAnimations().map((animation) => animation.finished)).then(() => undefined),
  );
  return menu;
}

test.describe("sizes", () => {
  /**
   * Half of 44px, less a tenth of a pixel: a 44px hit area passes, a 43px one
   * fails.
   */
  const REACH = 21.9;

  /**
   * That a tap anywhere in a 44px square centred on `control` lands on it. The
   * control is scrolled to the middle of the screen, and `elementFromPoint` at
   * the square's four corners must return the control or something inside it.
   * A padded box and a pseudo-element's hit area both pass; another element
   * overlapping the square fails, and so does a box under 44px.
   *
   * A box with rounded corners is hit-tested against its rect snapped to whole
   * pixels, which can sit up to a pixel from the fractional one, so a corner
   * counts when it lands on the control measured from the box's own centre or
   * from the centre of either snapped rect (rounded down, or to the nearest).
   */
  async function expectTapTarget(control: Locator, name: string) {
    const { box, misses } = await control.evaluate((el: HTMLElement, reach: number) => {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const rect = el.getBoundingClientRect();
      const centreOf = (snap: (value: number) => number) => ({
        x: (snap(rect.left) + snap(rect.right)) / 2,
        y: (snap(rect.top) + snap(rect.bottom)) / 2,
      });
      const centres = [centreOf((value) => value), centreOf(Math.floor), centreOf(Math.round)];
      const corners = [
        { label: "top left", dx: -1, dy: -1 },
        { label: "top right", dx: 1, dy: -1 },
        { label: "bottom left", dx: -1, dy: 1 },
        { label: "bottom right", dx: 1, dy: 1 },
      ];
      const misses: string[] = [];
      for (const { label, dx, dy } of corners) {
        const hits = centres.map(({ x, y }) => document.elementFromPoint(x + dx * reach, y + dy * reach));
        if (!hits.some((found) => found !== null && el.contains(found))) {
          const hit = hits[0];
          const found = hit
            ? `${hit.tagName.toLowerCase()}.${hit.getAttribute("class") ?? ""}`
            : "nothing";
          misses.push(`${label}: ${found}`);
        }
      }
      const round = (value: number) => Math.round(value * 10) / 10;
      return {
        box: `${round(rect.width)} x ${round(rect.height)} at (${round(rect.left)}, ${round(rect.top)})`,
        misses,
      };
    }, REACH);
    expect(misses, `${name}: its box is ${box}`).toEqual([]);
  }

  /** Every one of `controls` is a tap target, and there is at least one. */
  async function expectEachTapTarget(controls: Locator, name: string) {
    await expect(controls.first()).toBeVisible({ timeout: 15_000 });
    const all = await controls.all();
    for (const [index, control] of all.entries()) {
      await expectTapTarget(control, `${name} ${index + 1} of ${all.length}`);
    }
  }

  for (const width of WIDTHS) {
    test(`the header, the menu, the footer and the contact links are 44px targets at ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile && width !== IPHONE_WIDTH, NOT_RESIZED);
      await phoneAt(page, width, isMobile);
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: "Open menu" });
      await expectTapTarget(hamburger, "the menu button");
      await expectTapTarget(page.locator("header .nav-logo"), "the header's home link");

      const menu = await openMenu(page);
      const close = menu.getByRole("button", { name: "Close menu" });
      await expectTapTarget(close, "the menu's close button");
      await expectEachTapTarget(menu.getByRole("link"), "menu link");
      await expectTapTarget(
        menu.getByRole("button", { name: /current theme/i }),
        "the menu's theme button",
      );
      await close.click();
      await expect(menu).toBeHidden();

      await expectEachTapTarget(page.locator("footer.footer").getByRole("link"), "footer link");
      await expectEachTapTarget(
        page.locator("#contact .link-row").getByRole("link"),
        "contact link",
      );
    });

    // Its own test: a site without a music section skips this alone.
    test(`the music links are 44px targets at ${width}px`, async ({ page, isMobile }) => {
      test.skip(!SECTIONS.some(({ id }) => id === "music"), "the site shows no music section");
      test.skip(isMobile && width !== IPHONE_WIDTH, NOT_RESIZED);
      await phoneAt(page, width, isMobile);
      await page.goto("/");

      await expectEachTapTarget(page.locator("#music .link-row").getByRole("link"), "music link");
    });

    test(`a project page's buttons and breadcrumbs are 44px targets at ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile && width !== IPHONE_WIDTH, NOT_RESIZED);
      await phoneAt(page, width, isMobile);
      await routeFixtureProject(page);
      await page.goto(`/projects/${FIXTURE}`);
      // The page itself, not the loading frame, which has a trail with no links.
      // The README's own heading is an h1 too, so the page's is the first.
      await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });

      await expectEachTapTarget(page.locator("main .btn"), "project page button");
      await expectEachTapTarget(page.locator(".demo-actions > *"), "demo control");
      await expectEachTapTarget(
        page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link"),
        "breadcrumb link",
      );
    });
  }
});

test.describe("left edges", () => {
  /** The three left edges, in CSS pixels: the heading's, the text's, the gutter's. */
  const edgesOf = (page: Page, heading: string, text: string) =>
    page.evaluate(
      ({ headingSelector, textSelector }) => {
        const left = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect().left;
        const main = document.querySelector("main")!;
        return {
          heading: left(headingSelector),
          text: left(textSelector),
          gutter: main.getBoundingClientRect().left + parseFloat(getComputedStyle(main).paddingLeft),
        };
      },
      { headingSelector: heading, textSelector: text },
    );

  /**
   * That the heading, the text and the gutter start within 2px of each other.
   * Polled, because a lazily loaded section's styles can land a frame after its
   * text; a miss reports the three edges it last saw.
   */
  const expectLevel = (page: Page, heading: string, text: string) =>
    expect
      .poll(
        async () => {
          const edges = await edgesOf(page, heading, text);
          const all = [edges.heading, edges.text, edges.gutter];
          return Math.max(...all) - Math.min(...all) <= 2
            ? "level"
            : `heading ${edges.heading}, text ${edges.text}, gutter ${edges.gutter}`;
        },
        { message: "the heading, the text and the gutter start within 2px", timeout: 5_000 },
      )
      .toBe("level");

  for (const width of [360, 390] as const) {
    test(`the journey's text is on the gutter, level with its heading, at ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!SECTIONS.some(({ id }) => id === "journey"), "this site hides the journey");
      test.skip(isMobile && width !== IPHONE_WIDTH, NOT_RESIZED);
      await phoneAt(page, width, isMobile);
      await page.goto("/");
      await expect(page.locator("#journey .timeline-title").first()).toBeVisible({
        timeout: 15_000,
      });
      await expectLevel(page, "#journey h2", "#journey .timeline-title");
    });

    test(`a README's text is on the gutter, level with its heading, at ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(site.features?.github === "off", "site.yaml turns the GitHub panels off");
      test.skip(isMobile && width !== IPHONE_WIDTH, NOT_RESIZED);
      await phoneAt(page, width, isMobile);
      await routeFixtureProject(page);
      await page.goto(`/projects/${FIXTURE}`);
      await expect(page.locator("#readme .readme-content > p").first()).toBeVisible({
        timeout: 15_000,
      });
      await expectLevel(page, "#readme h2", "#readme .readme-content > p");
    });
  }
});

test.describe("pressed", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: IPHONE_WIDTH, height: PHONE_HEIGHT },
  });
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "pressed states are measured in Chromium, on a touch screen it emulates",
  );

  /** How a control looks, in the properties its pressed state changes. */
  const look = (control: Locator) =>
    control.evaluate((el: HTMLElement) => {
      const style = getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        textDecorationLine: style.textDecorationLine,
        backgroundImage: style.backgroundImage,
      };
    });

  type Pressable = {
    name: string;
    path: string;
    /** The screen's size, if not the phone's held upright. */
    viewport?: { width: number; height: number };
    /** The routes the page needs, set before it loads. */
    route?: (page: Page) => Promise<unknown>;
    /** What puts the control on the screen, if the page doesn't. */
    reveal?: (page: Page) => Promise<unknown>;
    locate: (page: Page) => Locator;
  };

  // The menu's controls are found by their classes, not their roles: a press
  // released outside the panel closes it, and a closed dialog has no roles.
  const PRESSABLES: Pressable[] = [
    {
      name: "the menu button",
      path: "/",
      locate: (page) => page.getByRole("button", { name: "Open menu" }),
    },
    {
      name: "the logo",
      path: "/",
      locate: (page) => page.locator("header .nav-logo"),
    },
    // The header's links show from 769px wide, so on a phone only in landscape.
    {
      name: "a nav link in landscape",
      path: "/",
      viewport: { width: PHONE_HEIGHT, height: IPHONE_WIDTH },
      locate: (page) => page.locator("header .nav-link").first(),
    },
    {
      name: "a menu link",
      path: "/",
      reveal: openMenu,
      locate: (page) => page.locator(".mobile-menu .mobile-menu-link").first(),
    },
    {
      name: "the menu's close button",
      path: "/",
      reveal: openMenu,
      locate: (page) => page.locator(".mobile-menu .mobile-menu-close"),
    },
    {
      name: "the menu's theme button",
      path: "/",
      reveal: openMenu,
      locate: (page) => page.locator(".mobile-menu .theme-toggle"),
    },
    {
      name: "a footer link",
      path: "/",
      locate: (page) => page.locator("footer.footer a").first(),
    },
    {
      name: "the filled button",
      path: "/",
      locate: (page) => page.locator(".home-hero .btn-primary"),
    },
    {
      name: "the ghost button",
      path: "/",
      locate: (page) => page.locator(".home-hero .btn-ghost"),
    },
    {
      name: "a project row",
      path: "/projects",
      locate: (page) => page.locator("a.project-row-link").first(),
    },
    {
      name: "a breadcrumb",
      path: `/projects/${FIXTURE}`,
      route: routeFixtureProject,
      locate: (page) =>
        page.getByRole("navigation", { name: "Breadcrumb" }).locator(".breadcrumb-link").first(),
    },
  ];

  for (const theme of ["light", "dark"] as const) {
    for (const control of PRESSABLES) {
      test(`${control.name} shows that it is pressed, and nothing for a hover, in ${theme} mode`, async ({
        page,
      }) => {
        await page.addInitScript((selectedTheme) => {
          localStorage.setItem(
            "ui-storage",
            JSON.stringify({ state: { theme: selectedTheme }, version: 0 }),
          );
        }, theme);
        if (control.viewport) await page.setViewportSize(control.viewport);
        await control.route?.(page);
        await page.goto(control.path);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^$/);
        // The premise: this context can't hover, which is what the hover rules
        // are gated on.
        expect(
          await page.evaluate(() => matchMedia("(hover: none)").matches),
          "a touch screen can't hover",
        ).toBe(true);

        // The page's sections load after it does and push what's below them
        // down, so the control is pressed only once they're in and it's on screen.
        await page.waitForLoadState("networkidle");
        await control.reveal?.(page);
        const target = control.locate(page);
        await expect(target).toBeVisible({ timeout: 15_000 });
        await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
        await expect(target).toBeInViewport();

        const rest = await look(target);
        const box = (await target.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        expect(await look(target), "a pointer over it shows nothing").toEqual(rest);

        // Pressed shows at once: :active has no transition.
        await page.mouse.down();
        const pressed = await look(target);
        expect(pressed, "pressed looks different from rest").not.toEqual(rest);
        expect(pressed.textDecorationLine, "pressed, it has no underline").toBe("none");

        // Released away from it, so nothing is clicked: no navigation, no
        // theme change.
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await expect.poll(() => look(target), "nothing sticks once released").toEqual(rest);
      });
    }
  }
});

test.describe("insets", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "WebKit's iPhone profile reports every inset as 0, so a notch is only drawn in Chromium",
  );

  type Insets = Partial<Record<"top" | "right" | "bottom" | "left", number>>;

  /** A device's insets on <html>, where the --safe-* names are defined (App.css). */
  const setInsets = (page: Page, insets: Insets) =>
    page.evaluate((values) => {
      for (const [side, pixels] of Object.entries(values)) {
        document.documentElement.style.setProperty(`--safe-${side}`, `${pixels}px`);
      }
    }, insets);

  /**
   * How far the footer's last link ends above the screen's bottom edge, with
   * the page scrolled to its end.
   */
  const footerClearance = (page: Page) =>
    page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      const links = document.querySelectorAll("footer.footer a");
      return window.innerHeight - links[links.length - 1].getBoundingClientRect().bottom;
    });

  /**
   * iPhone 13's numbers (Apple's): top 47 and bottom 34 in portrait; left and
   * right 47 and bottom 21 in landscape.
   */
  const PORTRAIT = { top: 47, bottom: 34 };
  const LANDSCAPE = { left: 47, right: 47, bottom: 21 };

  /** The home page at `size`, with `insets` set, its header showing. */
  async function homeWithInsets(page: Page, size: { width: number; height: number }, insets: Insets) {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("header .nav-logo")).toBeVisible();
    await expect(page.locator("main h1")).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await setInsets(page, insets);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
  }

  /**
   * That `measure` reaches `min`. Polled, because the layout can take a frame to
   * follow the insets; where it never does, the poll runs out and fails.
   */
  const expectAtLeast = (measure: () => Promise<number>, min: number, message: string) =>
    expect.poll(measure, { message, timeout: 5_000 }).toBeGreaterThanOrEqual(min);

  const logoBox = async (page: Page) => (await page.locator("header .nav-logo").boundingBox())!;

  /**
   * The header's home link, the page's headings and the footer's text clear the
   * notch's sides, and the footer the home bar.
   */
  async function expectClearOfLandscapeInsets(page: Page) {
    await expectAtLeast(
      async () => (await logoBox(page)).x,
      LANDSCAPE.left,
      "the home link starts clear of the notch",
    );
    await expectAtLeast(
      async () => (await page.locator("main h1").boundingBox())!.x,
      LANDSCAPE.left,
      "the page's text starts clear of the notch",
    );
    await expectAtLeast(
      () => footerClearance(page),
      LANDSCAPE.bottom,
      "the footer's last link clears the home bar",
    );

    // The gutters. The logo and the hero's heading sit well in from the edge on
    // a wide screen whether or not the gutter follows the insets, so they can't
    // show it: the section headings and the footer's text start and end at the
    // gutter. Edges are rounded to a tenth of a pixel, so layout's sub-pixel
    // steps don't decide a comparison.
    const measureGutters = () => page.evaluate(() => {
      const tenth = (value: number) => Math.round(value * 10) / 10;
      const edges = (selector: string) => {
        const boxes = Array.from(document.querySelectorAll(selector), (el) =>
          el.getBoundingClientRect(),
        );
        return {
          count: boxes.length,
          left: tenth(Math.min(...boxes.map((box) => box.left))),
          right: tenth(Math.max(...boxes.map((box) => box.right))),
        };
      };
      return {
        headings: edges(".page-section > h2"),
        footer: edges("footer.footer a, footer.footer p"),
        screen: window.innerWidth,
      };
    });
    const counted = await measureGutters();
    expect(counted.headings.count, "the page has section headings to measure").toBeGreaterThan(0);
    expect(counted.footer.count, "the footer has text and links to measure").toBeGreaterThan(0);
    await expectAtLeast(
      async () => (await measureGutters()).headings.left,
      LANDSCAPE.left,
      "the leftmost section heading starts clear of the notch",
    );
    await expectAtLeast(
      async () => (await measureGutters()).footer.left,
      LANDSCAPE.left,
      "the footer's text starts clear of the notch",
    );
    await expectAtLeast(
      async () => {
        const { footer, screen } = await measureGutters();
        return screen - footer.right;
      },
      LANDSCAPE.right,
      "the footer's text ends clear of the notch on the other side",
    );
  }

  test("portrait: the header, the footer and the menu clear the notch and the home bar", async ({
    page,
  }) => {
    await homeWithInsets(page, { width: IPHONE_WIDTH, height: PHONE_HEIGHT }, PORTRAIT);

    await expectAtLeast(
      async () => (await logoBox(page)).y,
      PORTRAIT.top,
      "the home link starts below the notch",
    );
    await expectAtLeast(
      () => footerClearance(page),
      PORTRAIT.bottom,
      "the footer's last link clears the home bar",
    );

    // The menu's list can be taller than the room, so it scrolls: its end, the
    // theme row, still clears the home bar.
    await openMenu(page);
    await expectAtLeast(
      () =>
        page.locator(".mobile-menu-content").evaluate((el) => {
          el.scrollTop = el.scrollHeight;
          const toggle = el.querySelector(".theme-toggle")!.getBoundingClientRect();
          return window.innerHeight - toggle.bottom;
        }),
      PORTRAIT.bottom,
      "the menu's theme button clears the home bar",
    );
  });

  test("landscape (844 x 390): the header, the page and the footer clear the notch and the home bar", async ({
    page,
  }) => {
    await homeWithInsets(page, { width: 844, height: 390 }, LANDSCAPE);
    await expectClearOfLandscapeInsets(page);
  });

  test("landscape at Playwright's iPhone 13 landscape size (750 x 342): the phone header clears the notch", async ({
    page,
  }) => {
    await homeWithInsets(page, { width: 750, height: 342 }, LANDSCAPE);
    await expectClearOfLandscapeInsets(page);
  });
});

test.describe("env probe", () => {
  test("WebKit's iPhone profile reports every safe-area inset as 0px", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(browserName !== "webkit" || !isMobile, "this measures WebKit's iPhone profile");
    await page.goto("/");
    // A fallback of 7px would show if env() weren't supported, and a positive
    // value would be a notch the profile models.
    const paddings = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position: fixed; visibility: hidden; padding: env(safe-area-inset-top, 7px) env(safe-area-inset-right, 7px) env(safe-area-inset-bottom, 7px) env(safe-area-inset-left, 7px);";
      document.body.append(probe);
      const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(probe);
      probe.remove();
      return [paddingTop, paddingRight, paddingBottom, paddingLeft];
    });
    expect(paddings, "top, right, bottom, left").toEqual(["0px", "0px", "0px", "0px"]);
  });
});

test.describe("labels", () => {
  test.skip(!SUMMON, "site.yaml turns SUMMON off, so there are no action buttons");

  /** Regeneration answered without calling the model, so the reset button mounts. */
  const stubRegenerate = (page: Page) =>
    page.route("**/api/regenerate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          content: { about: { about_text: "stubbed regeneration" } },
        }),
      }),
    );

  /** That `button`'s label sits on one line, inside the button. */
  async function expectOneLine(button: Locator, name: string) {
    const { overflow, lines } = await button.evaluate((el: HTMLElement) => {
      const text = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
      const range = document.createRange();
      if (text) range.selectNodeContents(text);
      return { overflow: el.scrollWidth - el.clientWidth, lines: range.getClientRects().length };
    });
    expect(overflow, `${name}: its label runs past the button`).toBeLessThanOrEqual(0);
    expect(lines, `${name}: its label wraps`).toBe(1);
  }

  test("SUMMON's and the reset button's labels sit on one line at 360px", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the iPhone profile is 390 wide; this runs in Chromium at 360");
    await page.setViewportSize({ width: 360, height: 800 });
    await stubRegenerate(page);
    await page.goto("/");
    await page.waitForSelector(".generate-btn", { timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expectOneLine(page.locator(".generate-btn"), "the SUMMON button");

    await page.locator(".generate-btn").click();
    await page.waitForSelector(".reset-btn", { timeout: 10_000 });
    await expectOneLine(page.locator(".reset-btn"), "the reset button");
  });
});
