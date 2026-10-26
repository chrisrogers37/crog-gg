// The iOS Simulator pass of the PR's build. The Simulator serves nothing: it loads the build serve.mjs serves on this
// runner. One phase per workflow step, state passed between them in <SIM_OUT>/state.json:
//   boot       pick the newest base iPhone on the newest iOS runtime, boot it, set its status bar
//   portrait   shots in portrait. Ladder A drives Safari through safaridriver's WebDriver (plain fetch against the W3C
//              endpoints); if safaridriver will not give a session, ladder B loads each URL with `simctl openurl`.
//   landscape  verify the device was rotated (the workflow's rotation step may be refused), then shoot on the same ladder
//   summary    summary.md: device, ladder, orientation, which shots were taken and which not, and why
// A shot is the device's own screen (`simctl io screenshot`): its notch, island and home indicator included, which a
// WebDriver viewport screenshot lacks.
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT = resolve(process.env.SIM_OUT || "sim-out");
const SITE = (process.env.SITE || "http://localhost:4180").replace(/\/+$/, "");
const WEBDRIVER = (process.env.WEBDRIVER || "http://127.0.0.1:4444").replace(/\/+$/, "");
const STANDARD = process.env.STANDARD || "/projects/storydump";
const STATE_FILE = join(OUT, "state.json");
const ELEMENT = "element-6066-11e4-a52e-4f735466cecf";
const DARK = `localStorage.setItem("ui-storage", JSON.stringify({ state: { theme: "dark" }, version: 0 })); return true;`;
const READY = `return document.readyState === "complete" && !!document.querySelector("main h1") && !document.querySelector('[role="status"][aria-label^="Loading"]');`;
// Reads, from inside the page, whether :active is in force while a finger is held on a link.
const PROBE = `
  window.__pressedProbe = null;
  document.addEventListener("touchstart", (event) => {
    const link = event.target.closest && event.target.closest("a");
    if (!link) return;
    const atTouchStart = getComputedStyle(link).color;
    setTimeout(() => {
      window.__pressedProbe = { active: link.matches(":active"), colorAtTouchStart: atTouchStart, colorAfterOneSecond: getComputedStyle(link).color };
    }, 1000);
  }, { passive: true, once: true });
  return true;`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const oneLine = (text, length) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, length);

function load() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
const save = (state) => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
function need() {
  const state = load();
  if (!state?.device) throw new Error("no device state: the boot phase did not run");
  return state;
}

function run(command, args, timeout = 120000) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout });
  return { ok: result.status === 0, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error ? String(result.error) : "" };
}
const simctl = (args, timeout) => run("xcrun", ["simctl", ...args], timeout);
const failure = (result) => oneLine(result.stderr || result.error || result.stdout || `exit ${result.status}`, 400);

/* The newest `iPhone <N>` (the base model: not mini, Pro, Max, SE or a letter after the number) on the newest iOS
   runtime that has one. */
function pickDevice() {
  const listed = simctl(["list", "devices", "available", "-j"]);
  if (!listed.ok) throw new Error(`simctl list devices failed: ${failure(listed)}`);
  const runtimes = Object.entries(JSON.parse(listed.stdout).devices)
    .map(([id, devices]) => {
      const match = id.match(/SimRuntime\.iOS-(\d+)-(\d+)(?:-(\d+))?$/);
      return match ? { id, version: [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)], devices } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.version[0] - a.version[0] || b.version[1] - a.version[1] || b.version[2] - a.version[2]);
  for (const runtime of runtimes) {
    const phones = runtime.devices
      .filter((device) => device.isAvailable !== false && /^iPhone \d+$/.test(device.name))
      .sort((a, b) => Number(b.name.slice(7)) - Number(a.name.slice(7)));
    if (phones.length > 0) {
      const [major, minor, patch] = runtime.version;
      return { name: phones[0].name, udid: phones[0].udid, runtime: `iOS ${major}.${minor}${patch ? `.${patch}` : ""}`, runtimeId: runtime.id };
    }
  }
  throw new Error("no base iPhone is available on any iOS runtime");
}

function boot() {
  mkdirSync(OUT, { recursive: true });
  const device = pickDevice();
  const state = { device, ladder: null, ladderNote: null, statusBar: null, portrait: { taken: [], notTaken: [] }, landscape: { rotated: null, how: null, taken: [], notTaken: [] }, pressed: null };
  save(state);
  console.log(`device: ${device.name}, ${device.runtime}, ${device.udid}`);
  const booted = simctl(["boot", device.udid]);
  if (!booted.ok && !/current state: Booted/i.test(booted.stderr)) throw new Error(`simctl boot failed: ${failure(booted)}`);
  const status = simctl(["bootstatus", device.udid, "-b"], 10 * 60 * 1000);
  if (!status.ok) throw new Error(`simctl bootstatus failed: ${failure(status)}`);
  const bar = simctl(["status_bar", device.udid, "override", "--time", "9:41", "--batteryState", "charged", "--batteryLevel", "100", "--wifiBars", "3", "--cellularBars", "4"]);
  state.statusBar = bar.ok ? "overridden: 9:41, charged battery at 100, 3 wifi bars, 4 cellular bars" : `not overridden: ${failure(bar)}`;
  save(state);
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `UDID=${device.udid}\n`);
}

/* The device's screen as a PNG. */
function screenshot(udid, name) {
  const result = simctl(["io", udid, "screenshot", "--type=png", join(OUT, name)], 60000);
  if (!result.ok) throw new Error(`simctl io screenshot: ${failure(result)}`);
}
const appearance = (udid, mode) => simctl(["ui", udid, "appearance", mode]);

/* Runs one shot; what it could not take is recorded with the reason. */
async function take(bucket, name, fn) {
  try {
    await fn();
    bucket.taken.push(name);
  } catch (error) {
    bucket.notTaken.push({ file: name, why: oneLine(error, 400) });
    console.log(`not taken: ${name}: ${oneLine(error, 400)}`);
  }
}

// ---- Ladder A: WebDriver --------------------------------------------------------------------------------------------

async function wd(method, path, body, timeout = 60000) {
  let response;
  try {
    response = await fetch(`${WEBDRIVER}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    throw new Error(`${method} ${path}: ${error.cause?.code || error.message}`);
  }
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status} ${text.slice(0, 600)}`);
  try {
    return JSON.parse(text).value;
  } catch {
    return text;
  }
}

/* A WebDriver session on Safari in the Simulator. The request is the test: safaridriver refusing it (the Simulator's
   Safari without Remote Automation, a runner without safaridriver) sends the run to ladder B. */
async function session(udid) {
  const created = await wd(
    "POST",
    "/session",
    { capabilities: { alwaysMatch: { browserName: "Safari", platformName: "iOS", "safari:useSimulator": true, "safari:deviceUDID": udid } } },
    180000,
  );
  if (!created?.sessionId) throw new Error(`no session id in the answer: ${oneLine(JSON.stringify(created), 300)}`);
  const base = `/session/${created.sessionId}`;
  const s = {
    go: (url) => wd("POST", `${base}/url`, { url }),
    exec: (script, args = []) => wd("POST", `${base}/execute/sync`, { script, args }),
    find: async (selector) => {
      const found = await wd("POST", `${base}/element`, { using: "css selector", value: selector });
      return found[ELEMENT] ?? Object.values(found)[0];
    },
    click: (element) => wd("POST", `${base}/element/${element}/click`, {}),
    touch: (actions, timeout) => wd("POST", `${base}/actions`, { actions: [{ type: "pointer", id: "finger", parameters: { pointerType: "touch" }, actions }] }, timeout),
    quit: () => wd("DELETE", base).catch(() => {}),
  };
  return s;
}

/* Waits for the page to be the page: loaded, its headline shown, no loading placeholder. */
async function ready(s) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await s.exec(READY).catch(() => false)) {
      await sleep(800);
      return;
    }
    await sleep(500);
  }
  throw new Error("the page did not finish loading within 30 s");
}

/* One swipe up, as a finger: the plan's coordinates in portrait, proportions of the screen in landscape. */
async function swipeUp(s, landscape) {
  const [width, height] = await s.exec("return [window.innerWidth, window.innerHeight];");
  const x = landscape ? Math.round(width / 2) : 195;
  const from = landscape ? Math.round(height * 0.8) : 600;
  const to = landscape ? Math.round(height * 0.2) : 250;
  await s.touch([
    { type: "pointerMove", duration: 0, x, y: from },
    { type: "pointerDown", button: 0 },
    { type: "pointerMove", duration: 300, x, y: to },
    { type: "pointerUp", button: 0 },
  ]);
}

/* The foot of the page, reached with a real swipe so that Safari's bar collapses and the bottom inset is in effect. */
async function toFooter(s, landscape) {
  await s.exec(`window.scrollTo({ top: Math.max(0, document.documentElement.scrollHeight - window.innerHeight - 400), behavior: "instant" }); return true;`);
  await sleep(500);
  for (let swipe = 0; swipe < 3; swipe++) {
    await swipeUp(s, landscape);
    await sleep(700);
    if (await s.exec("return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;")) break;
  }
  await sleep(800);
}

async function openMenu(s) {
  await s.exec(`window.scrollTo({ top: 0, behavior: "instant" }); return true;`);
  await sleep(400);
  await s.click(await s.find('[aria-label="Open menu"]'));
  await sleep(900);
}
async function closeMenu(s) {
  try {
    await s.click(await s.find('[aria-label="Close menu"]'));
  } catch {
    // the next page load closes the menu
  }
  await sleep(500);
}

/* Home, foot of the page and menu for one theme, in the given orientation. */
async function homeFooterMenu(state, bucket, s, theme, orientation, withMenu) {
  const udid = state.device.udid;
  const landscape = orientation === "landscape";
  await take(bucket, `sim-${orientation}-home-${theme}.png`, async () => {
    await s.go(`${SITE}/`);
    await ready(s);
    screenshot(udid, `sim-${orientation}-home-${theme}.png`);
  });
  await take(bucket, `sim-${orientation}-footer-${theme}.png`, async () => {
    await toFooter(s, landscape);
    screenshot(udid, `sim-${orientation}-footer-${theme}.png`);
  });
  if (withMenu) {
    await take(bucket, `sim-${orientation}-menu-${theme}.png`, async () => {
      await openMenu(s);
      screenshot(udid, `sim-${orientation}-menu-${theme}.png`);
      await closeMenu(s);
    });
  }
}

/* A held press on a footer link: the shot is taken while the finger is down, and the press ends away from the link, so
   nothing is followed. The probe reads, from the page, whether :active held. */
async function pressedShot(state, bucket, s) {
  const udid = state.device.udid;
  await take(bucket, "sim-portrait-pressed-light.png", async () => {
    await s.go(`${SITE}/`);
    await ready(s);
    await toFooter(s, false);
    // The link in the middle of the screen, then the finger aimed at the element itself, so no viewport
    // coordinates are involved: the first run's coordinates landed outside the viewport ("move target out of
    // bounds"). The release slides the finger up from where it is, so nothing is clicked.
    await s.exec(`document.querySelector(".footer-links a").scrollIntoView({ block: "center", behavior: "instant" }); return true;`);
    await sleep(500);
    const point = await s.exec(`const link = document.querySelector(".footer-links a"); return { label: link.textContent.trim() };`);
    const element = await s.find(".footer-links a");
    await s.exec(PROBE);
    const press = s
      .touch(
        [
          { type: "pointerMove", duration: 0, origin: { [ELEMENT]: element }, x: 0, y: 0 },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 4000 },
          { type: "pointerMove", duration: 100, origin: "pointer", x: 0, y: -120 },
          { type: "pointerUp", button: 0 },
        ],
        60000,
      )
      .then(() => null, (error) => error);
    await sleep(1500);
    let shotError = null;
    try {
      screenshot(udid, "sim-portrait-pressed-light.png");
    } catch (error) {
      shotError = error;
    }
    const pressError = await press;
    const probe = await s.exec("return window.__pressedProbe || null;").catch(() => null);
    state.pressed = { link: point.label, heldMs: 1500, probe, pressError: pressError ? oneLine(pressError, 300) : null };
    if (shotError) throw shotError;
    if (pressError) throw new Error(`the held press failed: ${oneLine(pressError, 300)}`);
  });
}

async function portraitA(state, s) {
  const udid = state.device.udid;
  const bucket = state.portrait;
  appearance(udid, "light");
  // Notch and home-bar evidence first, then the menu, then pressed, then dark.
  await homeFooterMenu(state, bucket, s, "light", "portrait", true);
  await pressedShot(state, bucket, s);
  await take(bucket, "sim-portrait-projects-light.png", async () => {
    await s.go(`${SITE}/projects`);
    await ready(s);
    screenshot(udid, "sim-portrait-projects-light.png");
  });
  await take(bucket, "sim-portrait-readme-light.png", async () => {
    await s.go(`${SITE}${STANDARD}`);
    await ready(s);
    await s.exec(`document.querySelector("#readme")?.scrollIntoView({ block: "start", behavior: "instant" }); return true;`);
    await sleep(800);
    screenshot(udid, "sim-portrait-readme-light.png");
  });
  // The site opens light whatever the OS prefers: dark is the stored choice, then a reload. The Simulator's own
  // appearance goes dark as well, so the status bar matches.
  try {
    await s.go(`${SITE}/`);
    await s.exec(DARK);
    appearance(udid, "dark");
    await homeFooterMenu(state, bucket, s, "dark", "portrait", true);
  } catch (error) {
    bucket.notTaken.push({ file: "sim-portrait-*-dark.png", why: `the dark theme could not be set: ${oneLine(error, 300)}` });
  }
  appearance(udid, "light");
}

/* Ladder B: `simctl openurl` and a screenshot, light only. */
async function openAndShoot(state, bucket, name, url) {
  const udid = state.device.udid;
  await take(bucket, name, async () => {
    const opened = simctl(["openurl", udid, url]);
    if (!opened.ok) throw new Error(`simctl openurl ${url}: ${failure(opened)}`);
    await sleep(8000);
    screenshot(udid, name);
  });
}

async function portraitB(state) {
  const bucket = state.portrait;
  appearance(state.device.udid, "light");
  await openAndShoot(state, bucket, "sim-portrait-home-light.png", `${SITE}/`);
  // The page's own hash scroll lands the contact heading under the header and the footer a screen below it. Safari's
  // bar is not collapsed in this state, so the home-bar strip is Safari's, not the page's. The query makes it a new
  // page load rather than a hash change.
  await openAndShoot(state, bucket, "sim-portrait-footer-light.png", `${SITE}/?footer#contact`);
  await openAndShoot(state, bucket, "sim-portrait-readme-light.png", `${SITE}${STANDARD}`);
  bucket.notTaken.push(
    { file: "sim-portrait-menu-*.png", why: "opening the menu needs a tap, which openurl cannot give" },
    { file: "sim-portrait-pressed-light.png", why: "a held press needs a touch, which openurl cannot give" },
    { file: "sim-portrait-*-dark.png", why: "dark needs a stored theme, which openurl cannot set" },
  );
}

async function portrait() {
  const state = need();
  let s = null;
  try {
    s = await session(state.device.udid);
    state.ladder = "A";
  } catch (error) {
    state.ladder = "B";
    state.ladderNote = oneLine(error.message, 1200);
    console.log(`WebDriver session request failed, continuing on ladder B: ${error.message}`);
  }
  save(state);
  try {
    if (s) await portraitA(state, s);
    else await portraitB(state);
  } finally {
    if (s) await s.quit();
    save(state);
  }
  if (state.portrait.taken.length === 0) throw new Error("no portrait shot was taken");
}

// ---- Landscape -------------------------------------------------------------------------------------------------------

function pngSize(file) {
  const head = readFileSync(file).subarray(0, 24);
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

async function landscape() {
  const state = need();
  const bucket = state.landscape;
  const udid = state.device.udid;
  const first = "sim-landscape-home-light.png";
  appearance(udid, "light");

  let s = null;
  if (state.ladder === "A") {
    try {
      s = await session(udid);
      await s.go(`${SITE}/`);
      await ready(s);
      const [width, height] = await s.exec("return [window.innerWidth, window.innerHeight];");
      bucket.rotated = width > height;
      bucket.how = `WebDriver: window ${width} x ${height}`;
    } catch (error) {
      bucket.how = `no WebDriver session for landscape (${oneLine(error.message, 300)}); checked by the screenshot's size`;
      if (s) await s.quit();
      s = null;
    }
  }
  if (!s) {
    const opened = simctl(["openurl", udid, `${SITE}/`]);
    if (!opened.ok) throw new Error(`simctl openurl: ${failure(opened)}`);
    await sleep(8000);
    screenshot(udid, first);
    const size = pngSize(join(OUT, first));
    bucket.rotated = size.width > size.height;
    bucket.how = `${bucket.how ? `${bucket.how}; ` : ""}screenshot ${size.width} x ${size.height} px`;
    if (!bucket.rotated) unlinkSync(join(OUT, first));
  }
  save(state);
  if (!bucket.rotated) {
    if (s) await s.quit();
    console.log(`landscape: the device is not rotated (${bucket.how})`);
    return;
  }

  try {
    if (s) {
      await homeFooterMenu(state, bucket, s, "light", "landscape", false);
      await take(bucket, "sim-landscape-projects-light.png", async () => {
        await s.go(`${SITE}/projects`);
        await ready(s);
        screenshot(udid, "sim-landscape-projects-light.png");
      });
      try {
        await s.go(`${SITE}/`);
        await s.exec(DARK);
        appearance(udid, "dark");
        await homeFooterMenu(state, bucket, s, "dark", "landscape", false);
      } catch (error) {
        bucket.notTaken.push({ file: "sim-landscape-*-dark.png", why: `the dark theme could not be set: ${oneLine(error, 300)}` });
      }
      appearance(udid, "light");
    } else {
      bucket.taken.push(first);
      await openAndShoot(state, bucket, "sim-landscape-footer-light.png", `${SITE}/?footer#contact`);
      await openAndShoot(state, bucket, "sim-landscape-projects-light.png", `${SITE}/projects`);
      bucket.notTaken.push({ file: "sim-landscape-*-dark.png", why: "dark is taken on ladder A only" });
    }
  } finally {
    if (s) await s.quit();
    save(state);
  }
}

// ---- Summary ---------------------------------------------------------------------------------------------------------

function summary() {
  const state = load();
  const lines = ["# iOS Simulator pass", ""];
  if (!state?.device) {
    lines.push("No device was booted: the boot step left no state, so there are no shots.");
  } else {
    const { device, portrait, landscape } = state;
    lines.push(`- Device: ${device.name}, ${device.runtime} (${device.runtimeId}), ${device.udid}.`);
    lines.push(`- Status bar: ${state.statusBar ?? "not set"}.`);
    lines.push(
      `- Ladder reached: ${state.ladder === "A" ? "A, Safari driven through safaridriver's WebDriver" : state.ladder === "B" ? "B, `simctl openurl` with a screenshot, no WebDriver" : "none: the portrait step did not run"}.`,
    );
    if (state.ladderNote) lines.push(`- The WebDriver session request failed with: \`${state.ladderNote}\``);
    lines.push(state.ladder ? "- Portrait: yes." : "- Portrait: the step did not get as far as choosing a ladder.");
    lines.push(
      landscape.rotated === null
        ? "- Landscape: the step did not get as far as checking the orientation."
        : landscape.rotated
          ? `- Landscape: rotated (${landscape.how}).`
          : `- Landscape: could not be rotated on the runner (${landscape.how}). The landscape evidence is the audit job's simulated-inset shots at 844 x 390 and Playwright's iPhone 13 landscape, labelled.`,
    );
    lines.push(
      state.pressed
        ? `- Pressed state: a finger held ${state.pressed.heldMs} ms on the "${state.pressed.link}" footer link, shot in sim-portrait-pressed-light.png. From inside the page: ${state.pressed.probe ? `:active ${state.pressed.probe.active ? "held" : "did NOT hold"} after 1 s (link colour at touchstart ${state.pressed.probe.colorAtTouchStart}, after 1 s ${state.pressed.probe.colorAfterOneSecond})` : "the probe gave no reading"}${state.pressed.pressError ? `; the press failed: ${state.pressed.pressError}` : ""}.`
        : "- Pressed state: not measured (it needs a held touch, which only ladder A gives).",
    );
    lines.push("", "## Shots taken", "");
    for (const [label, bucket] of [["Portrait", portrait], ["Landscape", landscape]]) {
      lines.push(`${label}: ${bucket.taken.length > 0 ? bucket.taken.join(", ") : "none"}.`);
    }
    const notTaken = [...portrait.notTaken, ...landscape.notTaken];
    if (notTaken.length > 0) {
      lines.push("", "## Not taken, and why", "", ...notTaken.map((entry) => `- ${entry.file}: ${entry.why}`));
    }
  }
  lines.push("");
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "summary.md"), lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
  console.log(lines.join("\n"));
}

const phases = { boot, portrait, landscape, summary };
const phase = phases[process.argv[2]];
if (!phase) {
  console.error(`usage: node simulator.mjs <${Object.keys(phases).join("|")}>`);
  process.exit(2);
}
try {
  await phase();
} catch (error) {
  console.error(`${process.argv[2]}: ${error.message}`);
  process.exitCode = 1;
}
