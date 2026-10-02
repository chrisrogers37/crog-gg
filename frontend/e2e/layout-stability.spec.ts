import { test, expect } from "@playwright/test";
import { SECTIONS, TABS_PATH, named, withLongAbout } from "./site";

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
      left:
        btn && row
          ? btn.getBoundingClientRect().left - row.getBoundingClientRect().left
          : null,
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

type Page = import("@playwright/test").Page;

/** The tabs' page, collapsed, once the preview's entry animation has finished. */
const openAbout = async (page: Page) => {
  await withLongAbout(page);
  await page.goto(TABS_PATH);
  await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
  await expect(page.locator("#section-panel")).toHaveCSS("opacity", "1");
};

/**
 * /about with About expanded, once its entry animation has finished. It waits
 * on the expanded panel's class rather than the shared panel id: defensive,
 * since by the time `.generate-btn` exists the preview has already gone.
 */
const expandAbout = async (page: Page) => {
  await openAbout(page);
  await page.click(".section-fade-btn");
  await page.waitForSelector(".generate-btn", { timeout: 10000 });
  await expect(page.locator(".content-section")).toHaveCSS("opacity", "1");
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
  test("expanding About does not displace the regenerate button", async ({
    page,
  }) => {
    await openAbout(page);

    await page.evaluate(ARM);
    await page.click(".section-fade-btn");
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    await page.waitForTimeout(1200); // sampling window: past the section transition

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

    await expandAbout(page);

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
  // It guards Timeline's growth, so it needs the site's Journey tab.
  const journey = SECTIONS.find(({ id }) => id === "journey");
  test.skip(!journey, "the site has no journey section");

  const openJourney = async (page: Page) => {
    await openAbout(page);
    await page.evaluate(ARM);
    await page
      .locator(".section-nav-button", { hasText: named(journey!.label) })
      .first()
      .click();
    await page.waitForSelector(".generate-btn", { timeout: 10000 });
    // sampling window: long enough for the logos to resolve, which is what
    // grows the track
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
  test("does not tear the page down to a loading skeleton", async ({
    page,
  }) => {
    await stubRegenerate(page);
    await expandAbout(page);

    await page.click(".generate-btn");
    await page.waitForSelector(".reset-btn", { timeout: 10000 });
    // The regeneration lands through About's prop at once, then again through
    // About's own replay, which shows a spinner for its ~600 ms; wait for both.
    await expect(page.locator(".about-content")).toContainText(
      "stubbed regeneration",
    );
    await expect(page.locator(".about-content .loading-overlay")).toHaveCount(0);

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
    await expandAbout(page);
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
    // The regeneration lands through About's prop at once, then again through
    // About's own replay, which shows a spinner for its ~600 ms; wait for both.
    const about = page.locator(".about-content");
    const replaying = about.locator(".loading-overlay");
    await expect(about).toContainText(
      "an arcane placeholder, woven for the test suite",
    );
    await expect(replaying).toHaveCount(0);

    await page.click(".reset-btn");
    await expect(page.locator(".reset-btn")).toHaveCount(0); // the reset committed
    await expect(replaying).toHaveCount(0); // and About's replay of it landed
    expect(await about.innerText()).toBe(original);
  });
});

/**
 * The last two causes in the cluster, and the two with no guard until now.
 *
 * Both assertions are the reviewer's live measurements against the deployed
 * preview, reused rather than re-derived, and both are shaped to reject the
 * near-miss rather than merely the bug:
 *
 *  - #148 asserts ZERO idle shift events, not a smaller magnitude. The defect
 *    moved the page 25px on a loop, so "reduced" and "stopped" are different
 *    outcomes and a magnitude threshold would accept the first as the second.
 *  - #149 asserts the unmount and the content move land in the SAME FRAME,
 *    not that the visible gap is small. A delay tuned to today's 300ms exit
 *    passes a gap threshold and fails same-frame coupling, which is the
 *    regression actually worth catching: the two are one commit or they are
 *    two waves, and there is no useful middle.
 *
 * Each carries a positive control. Zero movement is also what a page that
 * never loaded reports, and a test that cannot fail is worse than no test
 * because it removes the prompt to look (see #137).
 */

/** Sample the idle page: nav position, typewriter box, and its text. */
const ARM_IDLE = () => {
  const w = window as unknown as Record<string, unknown>;
  w.__idle = [];
  const tick = () => {
    const nav = document.querySelector<HTMLElement>(".section-nav");
    const msg = document.querySelector<HTMLElement>(".welcome-message");
    (w.__idle as unknown[]).push({
      navTop: nav ? nav.offsetTop : null,
      msgHeight: msg ? msg.offsetHeight : null,
      text: msg ? msg.innerText : null,
    });
    w.__idleRaf = requestAnimationFrame(tick);
  };
  tick();
};

const READ_IDLE = () => {
  const w = window as unknown as Record<string, unknown>;
  cancelAnimationFrame(w.__idleRaf as number);
  return w.__idle as {
    navTop: number | null;
    msgHeight: number | null;
    text: string | null;
  }[];
};

test.describe("idle typewriter does not reflow the page (#148)", () => {
  test("no layout movement across 45s at 375x667 with no interaction", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 375, height: 667 });
    await openAbout(page);

    await page.evaluate(ARM_IDLE);
    // observation window: nothing is clicked; the loop runs alone
    await page.waitForTimeout(45000);
    const samples = await page.evaluate(READ_IDLE);

    const mounted = samples.filter((s) => s.navTop !== null);
    expect(mounted.length).toBeGreaterThan(0);

    // POSITIVE CONTROL. The typewriter has to have actually cycled, or the
    // page never rendered its content and zero movement means nothing. This
    // is the exact reading error the fix's own verification nearly shipped:
    // a page that failed to load reports 0px travel and 0 events too.
    const changes = mounted.filter(
      (s, i) => i > 0 && s.text !== mounted[i - 1].text,
    ).length;
    expect(changes).toBeGreaterThan(50);

    // The row holds the tallest message at this width, so neither the box nor
    // anything below it moves while characters are typed and deleted.
    expect(travel(mounted.map((s) => s.msgHeight))).toBe(0);
    expect(travel(mounted.map((s) => s.navTop))).toBe(0);
  });
});

/** Sample a collapse: whether the button card is present, and where the
 *  content below the section sits. Index in the array is the frame number. */
const ARM_COLLAPSE = () => {
  const w = window as unknown as Record<string, unknown>;
  w.__col = [];
  const tick = () => {
    const cta = document.querySelector<HTMLElement>(".contact-cta");
    (w.__col as unknown[]).push({
      hasButtons: !!document.querySelector(".action-buttons"),
      ctaTop: cta ? cta.offsetTop : null,
    });
    w.__colRaf = requestAnimationFrame(tick);
  };
  tick();
};

const READ_COLLAPSE = () => {
  const w = window as unknown as Record<string, unknown>;
  cancelAnimationFrame(w.__colRaf as number);
  return w.__col as { hasButtons: boolean; ctaTop: number | null }[];
};

test.describe("collapsing a section moves the page once (#149)", () => {
  test("the button card unmounts in the same frame the content moves", async ({
    page,
  }) => {
    await expandAbout(page);

    await page.evaluate(ARM_COLLAPSE);
    await page.locator(".section-nav-button.active").first().click(); // collapse back to the preview
    await page.waitForTimeout(1600); // sampling window: past the exit transition
    const s = await page.evaluate(READ_COLLAPSE);

    // POSITIVE CONTROLS. The card must have been present and then gone, and
    // the content below must have actually moved. Without both, "one wave"
    // is satisfied by nothing happening at all.
    const unmount = s.findIndex(
      (x, i) => i > 0 && s[i - 1].hasButtons && !x.hasButtons,
    );
    expect(unmount).toBeGreaterThan(0);

    const moves = s
      .map((x, i) => (i > 0 && x.ctaTop !== s[i - 1].ctaTop ? i : -1))
      .filter((i) => i > 0);
    expect(moves.length).toBeGreaterThan(0);

    // One user action, one movement. Two waves ~315ms apart was the bug.
    expect(moves.length).toBe(1);

    // And the wave is the unmount, not a separate later event. Both DOM
    // changes belong to one commit, so no frame can observe one without the
    // other -- which is why this is an equality rather than a tolerance.
    expect(moves[0]).toBe(unmount);
  });
});
