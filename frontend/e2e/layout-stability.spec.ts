import { test, expect } from "@playwright/test";

/**
 * Interaction-shift gates for the action buttons.
 *
 * These exist because Cumulative Layout Shift cannot see this class of defect.
 * A shift within 500ms of a click is attributed to recent user input and
 * excluded from CLS by design, so the browser recorded the regenerate button
 * being displaced 607px, named `action-buttons` as the source, and still scored
 * the page at 0.0003. A Lighthouse budget or a Core Web Vitals gate would
 * report this page as clean while the button a visitor just clicked jumped out
 * from under their cursor.
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
      // horizontal position of the button within its row
      left: btn && row ? btn.getBoundingClientRect().left - row.getBoundingClientRect().left : null,
      width: btn ? btn.offsetWidth : null,
      hasReset: !!document.querySelector(".reset-btn"),
      hasGenerate: !!btn,
      // the loading skeleton renders in place of the whole page
      hasSkeleton: !!document.querySelector(".skeleton-photo"),
      hasHeading: !!document.querySelector("header h1"),
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

/** Regeneration answered without calling the model: flips hasModifiedContent
 *  (so the reset button mounts) while leaving the bio untouched. */
const stubRegenerate = (page: import("@playwright/test").Page) =>
  page.route("**/api/regenerate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, content: {} }),
    }),
  );

const travel = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return Math.round(Math.max(...present) - Math.min(...present));
};

test.describe("action button layout stability", () => {
  test("expanding About does not displace the regenerate button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.waitForTimeout(1000); // let the preview's entry animation finish

    await page.evaluate(ARM);
    await page.click(".section-fade-btn");
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    await page.waitForTimeout(1200); // past the section transition

    const samples = await page.evaluate(READ);
    const mounted = samples.filter((s) => s.top !== null);

    // The button has to actually appear, or the assertion below is vacuous.
    expect(mounted.length).toBeGreaterThan(0);

    // It must not appear before the content it sits beneath. Mounting against
    // the collapsed preview is what let the expanded content carry it down.
    expect(travel(mounted.map((s) => s.top))).toBe(0);
  });

  test("the regenerate button does not move when the reset button appears", async ({
    page,
  }) => {
    await stubRegenerate(page);

    await page.goto("/");
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.click(".section-fade-btn");
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    await page.waitForTimeout(1200);

    await page.evaluate(ARM);
    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    await page.waitForTimeout(800);

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
 * The journey section fails in the opposite direction to the section above: its
 * content mounts on time and then keeps growing for ~500ms, from two causes
 * that are independent of each other and of the mount ordering.
 *
 *  - Async-resolved logos rendered nothing at all until they arrived, so each
 *    one changed the height of the line it appeared on (~28px total, every
 *    viewport).
 *  - The skill-bubble row was populated from an effect, so the first painted
 *    frame had an empty row which then gained a line (~30px). It only moves the
 *    button at narrow widths, where the bubbles sit above the timeline instead
 *    of beside it.
 *
 * Both are gated below, and the narrow-viewport case is gated separately
 * because the desktop grid hides the second cause entirely.
 */
test.describe("journey section post-mount stability", () => {
  const openJourney = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.evaluate(ARM);
    await page
      .locator(".section-nav-button", { hasText: /^journey$/i })
      .first()
      .click();
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    // long enough for the logos to resolve, which is what grows the track
    await page.waitForTimeout(3000);
    return page.evaluate(READ);
  };

  test("opening journey does not displace the regenerate button", async ({
    page,
  }) => {
    const samples = await openJourney(page);
    const mounted = samples.filter((s) => s.top !== null);
    expect(mounted.length).toBeGreaterThan(0);
    expect(travel(mounted.map((s) => s.top))).toBe(0);
  });

  test("opening journey is stable at a narrow viewport too", async ({
    page,
  }) => {
    // Below the 768px breakpoint the skills column moves above the timeline, so
    // the bubble row's height is in front of everything rather than beside it.
    await page.setViewportSize({ width: 375, height: 667 });
    const samples = await openJourney(page);
    const mounted = samples.filter((s) => s.top !== null);
    expect(mounted.length).toBeGreaterThan(0);
    expect(travel(mounted.map((s) => s.top))).toBe(0);
  });
});

/**
 * Undoing a regeneration reads local content that is already in the store. It
 * used to do that behind the same `isLoading` flag the first page load uses,
 * and the page renders a loading skeleton whenever that flag is set — so the
 * whole page was torn down and rebuilt to restore values held in memory.
 */
test.describe("undoing a regeneration", () => {
  test("does not tear the page down to a loading skeleton", async ({ page }) => {
    await stubRegenerate(page);
    await page.goto("/");
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.click(".section-fade-btn");
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    await page.waitForTimeout(600);

    await page.evaluate(ARM);
    await page.click(".reset-btn");
    await page.waitForTimeout(2000);
    const samples = await page.evaluate(READ);

    // The reset has to have actually happened, or every assertion below passes
    // because nothing was exercised.
    expect(samples.some((s) => s.hasReset)).toBe(true);
    expect(samples.some((s) => !s.hasReset)).toBe(true);

    // Nothing may be replaced by the first-load skeleton...
    expect(samples.filter((s) => s.hasSkeleton)).toHaveLength(0);
    // ...the header must survive...
    expect(samples.filter((s) => !s.hasHeading)).toHaveLength(0);
    // ...and the button the visitor is looking at must not vanish and return.
    expect(samples.filter((s) => !s.hasGenerate)).toHaveLength(0);
  });

  // Not a gate on the defect — this one passes on the unfixed code too, because
  // re-reading the files did restore the content correctly. It guards the change
  // of *source*: the restore now comes from the originals held in the store, and
  // this asserts that produces the same result the file read did.
  test("restores the original content", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.click(".section-fade-btn");
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    const original = await page.locator(".about-content").innerText();

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
    // the About section applies a regeneration behind its own ~600ms transition
    await page.waitForTimeout(1600);
    const regenerated = await page.locator(".about-content").innerText();
    expect(regenerated).not.toBe(original);

    await page.click(".reset-btn");
    await page.waitForTimeout(1800);
    expect(await page.locator(".about-content").innerText()).toBe(original);
  });
});
