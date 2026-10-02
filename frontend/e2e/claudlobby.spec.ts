import { test, expect } from "./fixtures";
import { CLAUDLOBBY_REPO as REPO } from "../src/content/links";
import { claudfather } from "../src/styles/palette";
import { CLAUDLOBBY, cardOf, expectBelowHeader, site } from "./site";

/**
 * Claudlobby's project page: its own sections (#173), since the redesign one
 * project among the owner's.
 *
 * Philosophy: test structure and behavior, not copy. The one piece of text
 * checked is the product's name, because naming it above the fold is the
 * point of the page. Links are found by where they go.
 */

const PAGE = "/projects/claudlobby";

// The whole file is the page's, which only a site listing Claudlobby has.
test.skip(!CLAUDLOBBY, "the site doesn't list Claudlobby");

const VIEWPORTS = [
  ["desktop", { width: 1366, height: 768 }],
  ["phone", { width: 390, height: 844 }],
] as const;

/** A palette hex as getComputedStyle reports it. */
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(", ")})`;

// And an iPhone SE's screen, for the first screen alone.
const SMALL_PHONE = { width: 375, height: 667 };

for (const [label, viewport] of [...VIEWPORTS, ["small phone", SMALL_PHONE] as const]) {
  test(`the first screen names Claudlobby, shows both CTAs and its maturity (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(PAGE);

    const hero = page.locator(".page-hero");
    await expect(hero.locator("h1")).toBeVisible();
    await expect(hero).toContainText(/claudlobby/i);
    // Wholly on screen, without scrolling: both CTAs and Claudfather's mark.
    for (const selector of [`a[href="${REPO}"]`, 'a[href="#quickstart"]', ".cl-mark"]) {
      await expect(hero.locator(selector)).toBeInViewport({ ratio: 1 });
    }
    const maturity = hero.locator(".cl-maturity");
    if (viewport === SMALL_PHONE) {
      // The panel runs edge to edge there, its gutters given to the words:
      // that keeps the maturity note on a phone's first screen (it ends at
      // 570 px). CI's fonts wrap wider than a phone's, so here the note is
      // held to begin on it.
      const panel = (await hero.boundingBox())!;
      expect(panel.x).toBe(0);
      expect(panel.width).toBe(viewport.width);
      await expect(maturity.locator(".badge")).toBeInViewport({ ratio: 1 });
    } else {
      // The maturity note that qualifies them (#179), wholly.
      await expect(maturity).toBeInViewport({ ratio: 1 });
    }
    // A panel padded all round: the project page's rule for the hero under
    // its breadcrumbs (no top padding) isn't this one's.
    await expect(hero).not.toHaveCSS("padding-top", "0px");
  });
}

test.describe("Claudlobby's page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator(".page-hero h1")).toBeVisible();
  });

  test("links the repo from its hero; the site's header and footer don't", async ({ page }) => {
    const link = page.locator(`.page-hero a[href="${REPO}"]`);
    await expect(link).toBeVisible();
    expect(await link.getAttribute("rel")).toContain("noopener");
    // The owner's site around it: Claudlobby is one of its projects.
    await expect(page.locator(`header.compact-header a[href^="${REPO}"]`)).toHaveCount(0);
    await expect(page.locator(`footer a[href^="${REPO}"]`)).toHaveCount(0);
  });

  test("wears Claudfather's mark, loaded", async ({ page }) => {
    // A real image, not a broken one, once its bytes are in.
    const mark = page.locator(".page-hero img.cl-mark");
    await expect(mark).toBeVisible();
    await expect
      .poll(() => mark.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  });

  test("keeps its hero Claudfather's night in both themes; its links take each theme's orange", async ({
    page,
  }) => {
    const hero = page.locator(".page-hero.cl-hero");
    const link = page.locator("#quickstart a").first();
    await expect(hero).toHaveCSS("background-color", rgb(claudfather.charcoal));
    await expect(link).toHaveCSS("color", rgb(claudfather.orangeDeep));

    // Light, then dark: the links turn, the hero doesn't.
    await page.getByRole("button", { name: /current theme/i }).first().click();
    await expect(link).toHaveCSS("color", rgb(claudfather.orange));
    await expect(hero).toHaveCSS("background-color", rgb(claudfather.charcoal));
  });

  test("says nothing of the owner's: the site around it does", async ({ page }) => {
    await expect(page.locator(".page-hero")).not.toContainText(site.owner.name);
  });

  test("sits under the site's breadcrumbs, back to the projects", async ({ page }) => {
    const trail = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(trail.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
  });

  for (const [label, viewport] of VIEWPORTS) {
    test(`the Quickstart button lands below the sticky header (${label})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      // Instant scrolling, so the check below sees where the jump lands.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator('.page-hero a[href="#quickstart"]').click();
      await expect(page).toHaveURL(/#quickstart$/);

      // The header stays on screen, and the heading sits below it.
      expect((await page.locator("header.compact-header").boundingBox())?.y).toBe(0);
      await expectBelowHeader(page, "#quickstart h2");
    });
  }

  test("Get updates points at the repo's releases and their feed", async ({ page }) => {
    // Instant scrolling, so the check below sees where the jump lands.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('.page-hero a[href="#updates"]').click();
    await expect(page).toHaveURL(/#updates$/);
    await expect(page.locator("#updates h2")).toBeInViewport();
    for (const href of [`${REPO}/releases`, `${REPO}/releases.atom`]) {
      const link = page.locator(`#updates a[href="${href}"]`);
      await expect(link, href).toBeVisible();
      expect(await link.getAttribute("rel"), href).toContain("noopener");
    }
    await expect(page.locator("#updates form")).toHaveCount(0);
  });

  test("the quickstart sends you to the README's own steps", async ({ page }) => {
    const readme = page.locator(`#quickstart a[href="${REPO}#quick-start"]`);
    await expect(readme).toBeVisible();
    expect(await readme.getAttribute("rel")).toContain("noopener");
  });

  test("shows the library counts with their source", async ({ page }) => {
    const counts = page.locator(".cl-counts dd");
    await expect(counts.first()).toBeVisible();
    for (const value of await counts.allTextContents()) {
      expect(value).toMatch(/^\d+$/);
    }
    await expect(page.locator(`.cl-source a[href^="${REPO}/blob/"]`)).toBeVisible();
  });
});

test.describe("Reached in the app", () => {
  test("the page's head points link previews at its own card", async ({ page }) => {
    // From /projects, whose head names the site's card, so only the app's own
    // update can name this page's (prerender.spec.ts holds the built head).
    await page.goto("/projects");
    await page.locator(`a[href="${PAGE}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${site.site.url}${cardOf(PAGE).path}`,
    );
  });
});

test.describe("A shared link to one of its sections", () => {
  test("opens on it, below the header, once the page is in", async ({ page }) => {
    // Mid-page and off the first screen, so the page has to scroll there, and
    // can bring the section all the way up: only the sections' scroll margin
    // keeps the heading out from under the header.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${PAGE}#quickstart`);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expectBelowHeader(page, "#quickstart h2");
  });
});
