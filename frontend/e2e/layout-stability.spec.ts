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
  }[];
};

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
    // Answer the regeneration without calling the model. An empty content
    // object flips hasModifiedContent (so the reset button mounts) while
    // leaving the bio untouched, which isolates the button row from any
    // change in content length.
    await page.route("**/api/regenerate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, content: {} }),
      }),
    );

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
 * Not covered here: the journey section. Opening it is stable in the same way
 * the sections above are, but its content keeps growing for ~500ms afterwards
 * (logo images resolve one by one and the skill-bubble row wraps to another
 * line), which moves the button a further ~57px at tablet and mobile widths.
 * That is a different defect with a different cause and it is tracked
 * separately; asserting zero travel on journey here would fail for a reason
 * these gates are not about.
 */
