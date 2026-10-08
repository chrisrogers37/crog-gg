import { test, expect } from "./fixtures";
import { SECTIONS, SUMMON } from "./site";

/**
 * Interaction-shift gates for SUMMON NEW LORE.
 *
 * These exist because Cumulative Layout Shift cannot see this class of defect.
 * A shift within 500ms of a click is attributed to recent user input and
 * excluded from CLS by design, so the browser once recorded the regenerate
 * button being displaced 607px, named `action-buttons` as the source, and
 * still scored the page at 0.0003. A Lighthouse budget or a Core Web Vitals
 * gate would report such a page as clean while the button a visitor just
 * clicked jumped out from under their cursor.
 *
 * So the assertion has to be geometric rather than metric: sample the button's
 * own box every animation frame across the interaction and require it not to
 * move. Both measurements are deliberately scroll- and transform-immune —
 * offsetTop/offsetLeft describe the layout box, where getBoundingClientRect
 * would also pick up the :hover scale the pointer leaves behind after a click.
 */

/** Start sampling geometry every animation frame. */
const ARM = () => {
  const w = window as unknown as Record<string, unknown>;
  w.__samples = [];
  const tick = () => {
    const btn = document.querySelector<HTMLElement>(".generate-btn");
    const row = document.querySelector<HTMLElement>(".action-buttons");
    (w.__samples as unknown[]).push({
      // vertical position of the row within the page, independent of scroll
      top: row ? row.offsetTop : null,
      // horizontal position of the button's box within its row (the wrapper
      // and the row share an offset parent)
      left:
        btn && row
          ? btn.closest<HTMLElement>(".cooldown-btn-wrapper")!.offsetLeft - row.offsetLeft
          : null,
      width: btn ? btn.offsetWidth : null,
      hasReset: !!document.querySelector(".reset-btn"),
      hasGenerate: !!btn,
      // the loading skeleton renders in place of the whole page
      hasSkeleton: !!document.querySelector(".home-skeleton"),
      hasHeading: !!document.querySelector(".page-hero h1"),
    });
    w.__raf = requestAnimationFrame(tick);
  };
  tick();
};

const READ = () => {
  const w = window as unknown as Record<string, unknown>;
  cancelAnimationFrame(w.__raf as number);
  return w.__samples as {
    top: number | null;
    left: number | null;
    width: number | null;
    hasReset: boolean;
    hasGenerate: boolean;
    hasSkeleton: boolean;
    hasHeading: boolean;
  }[];
};

type Page = import("@playwright/test").Page;

/** The home page once its fonts are in and SUMMON is on it. */
const openHome = async (page: Page) => {
  await page.goto("/");
  await page.waitForSelector(".generate-btn", { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
};

/** Regeneration answered without calling the model, returning one section the
 *  store will accept so the reset button mounts.
 *
 *  The payload used to be an empty `content: {}`, which worked only while
 *  hasModifiedContent was set for reaching the success path at all. It is now
 *  derived from what was actually applied (#142), and an empty content object
 *  is precisely the all-refused case — nothing applied, no reset button, and
 *  these tests time out waiting for one. `about_text` is a key of the real bio
 *  being replaced, which is what the store's validation requires before it will
 *  apply a section. */
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

const travel = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return Math.round(Math.max(...present) - Math.min(...present));
};

test.describe("action button layout stability", () => {
  test.skip(!SUMMON, "site.yaml turns SUMMON off, so there are no action buttons");

  test("nothing moves the regenerate button while the page settles", async ({ page }) => {
    // Everything that loads late (the journey's logos, the projects, the
    // photo strip) sits below the button, so its place is final once it
    // is on the page.
    await openHome(page);
    await page.evaluate(ARM);
    await page.waitForTimeout(3000); // sampling window: the late loads landing
    const samples = await page.evaluate(READ);

    const mounted = samples.filter((s) => s.top !== null);
    expect(mounted.length).toBeGreaterThan(0);
    expect(travel(mounted.map((s) => s.top))).toBe(0);
  });

  test("the regenerate button does not move when the reset button appears", async ({
    page,
  }) => {
    await stubRegenerate(page);
    await openHome(page);

    await page.evaluate(ARM);
    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    await page.waitForTimeout(800); // sampling window: the reset button arriving

    const samples = await page.evaluate(READ);

    // The reset button has to have actually mounted during the window, or
    // there was nothing to displace the primary button and this passes for
    // the wrong reason.
    expect(samples.some((s) => s.hasReset)).toBe(true);
    expect(samples.some((s) => !s.hasReset)).toBe(true);

    // The primary button keeps its place in the row...
    expect(travel(samples.map((s) => s.left))).toBe(0);
    // ...and its own size, across every label it cycles through. A button
    // sized to its current label resizes under the cursor mid-click.
    expect(travel(samples.map((s) => s.width))).toBe(0);
  });
});

/**
 * Undoing a regeneration reads local content that is already in the store. It
 * used to do that behind the same `isLoading` flag the first page load uses,
 * and the page renders a loading skeleton whenever that flag is set — so the
 * whole page was torn down and rebuilt to restore values held in memory.
 */
test.describe("undoing a regeneration", () => {
  test.skip(!SUMMON, "site.yaml turns SUMMON off, so there are no action buttons");
  test("does not tear the page down to a loading skeleton", async ({
    page,
  }) => {
    await stubRegenerate(page);
    await openHome(page);

    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    await expect(page.locator("#about .about-text")).toContainText("stubbed regeneration");

    await page.evaluate(ARM);
    await page.click(".reset-btn");
    await page.waitForTimeout(2000); // sampling window: the undo, start to end
    const samples = await page.evaluate(READ);

    // The reset has to have actually happened, or every assertion below passes
    // because nothing was exercised.
    expect(samples.some((s) => s.hasReset)).toBe(true);
    expect(samples.some((s) => !s.hasReset)).toBe(true);

    // Nothing may be replaced by the first-load skeleton...
    expect(samples.filter((s) => s.hasSkeleton)).toHaveLength(0);
    // ...the hero must survive...
    expect(samples.filter((s) => !s.hasHeading)).toHaveLength(0);
    // ...and the button the visitor is looking at must not vanish and return.
    expect(samples.filter((s) => !s.hasGenerate)).toHaveLength(0);
  });

  // It guards the change of *source*: the restore comes from the originals
  // held in the store, and this asserts that produces the text the page
  // loaded with.
  test("restores the original content", async ({ page }) => {
    await openHome(page);
    const about = page.locator("#about .about-text");
    const original = await about.innerText();

    // A regeneration that genuinely changes the rendered bio, so the restore
    // has something to undo and cannot pass by doing nothing. The response
    // echoes the bio the request sent, with one field rewritten — the same
    // shape a real partial rewrite has, and independent of what the content
    // files happen to say.
    await page.route("**/api/regenerate", async (route) => {
      const sent = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          content: {
            about: {
              ...sent.sections.about,
              about_text: "an arcane placeholder, woven for the test suite",
            },
          },
        }),
      });
    });
    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    await expect(about).toContainText("an arcane placeholder, woven for the test suite");

    await page.click(".reset-btn");
    await expect(page.locator(".reset-btn")).toHaveCount(0); // the reset committed
    await expect(about).not.toContainText("an arcane placeholder");
    expect(await about.innerText()).toBe(original);
  });
});

/** Sum the layout shifts from here on, as the browser scores them. */
const OBSERVE_SHIFTS = () => {
  const w = window as unknown as Record<string, number>;
  w.__shift = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
    })[]) {
      if (!entry.hadRecentInput) w.__shift += entry.value;
    }
  }).observe({ type: "layout-shift" });
};

// What #247's UI review measured on the preview: 0.11 on a desktop's cold
// load, and 0.46 on a phone that loads the page and reads down the journey.
test.describe("the home page holds still while it loads and scrolls (#247)", () => {
  test("its skeleton keeps the footer below the fold until the page arrives", async ({
    page,
  }) => {
    // bio.yaml held back, so the skeleton stands in for the page meanwhile.
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/content/bio.yaml", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.locator(".home-skeleton")).toBeVisible();
    // Shorter than the screen, it let the footer up into view, and the page
    // arriving dropped it away again: a shift on every cold load.
    await expect(page.locator("footer.footer")).not.toBeInViewport();
    release();
    await expect(page.locator(".home-hero h1")).toBeVisible();
  });

  test("the journey doesn't push the entries about as a phone reads down it", async ({
    page,
  }) => {
    test.skip(!SECTIONS.some(({ id }) => id === "journey"), "the site shows no journey");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("#journey .timeline-entry").first()).toBeAttached();
    await page.evaluate(() => document.fonts.ready);

    await page.evaluate(OBSERVE_SHIFTS);
    // Down a step at a time, as a reader does, to a screen past the journey.
    // Each entry that scrolls in adds its skills to the cloud; above the
    // entries, the cloud grew and pushed the one being read down.
    const past = await page
      .locator("#journey")
      .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY + window.innerHeight);
    for (let step = 0; step < 60; step++) {
      const y = await page.evaluate(() => {
        window.scrollBy(0, 300);
        return window.scrollY;
      });
      await page.waitForTimeout(120);
      if (y + 812 >= past) break;
    }
    // The last entries' animations, and the bubbles they add.
    await page.waitForTimeout(1000);

    // POSITIVE CONTROL: the scroll went past the journey, so every entry came by.
    const bottom = await page.locator("#journey").evaluate((el) => el.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThan(0);
    expect(
      await page.evaluate(() => (window as unknown as Record<string, number>).__shift),
    ).toBeLessThan(0.01);
  });
});
