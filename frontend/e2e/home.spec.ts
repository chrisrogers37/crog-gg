import { test, expect } from "@playwright/test";

/**
 * Home Page E2E Tests: Claudlobby's front door (#173)
 *
 * Philosophy: test structure and behavior, not copy. The one piece of text
 * checked is the product's name, because naming it above the fold is the
 * point of the page. Links are found by where they go.
 */

const REPO = "https://github.com/Claudfather/Claudlobby";

const VIEWPORTS = [
  ["desktop", { width: 1366, height: 768 }],
  ["phone", { width: 390, height: 844 }],
] as const;

for (const [label, viewport] of VIEWPORTS) {
  test(`the first screen names Claudlobby and shows both CTAs (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.locator(".cl-hero h1")).toBeVisible();
    await expect(page.locator(".cl-hero")).toContainText(/claudlobby/i);
    // Wholly on screen, without scrolling.
    for (const cta of [`.cl-hero a[href="${REPO}"]`, '.cl-hero a[href="#quickstart"]']) {
      await expect(page.locator(cta)).toBeInViewport({ ratio: 1 });
    }
  });
}

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("links the Claudlobby repo from the hero, header and footer", async ({
    page,
  }) => {
    for (const area of [".cl-hero", "header", "footer"]) {
      const link = page.locator(`${area} a[href="${REPO}"]`).first();
      await expect(link, area).toBeVisible();
      expect(await link.getAttribute("rel"), area).toContain("noopener");
    }
  });

  for (const [label, viewport] of VIEWPORTS) {
    test(`the Quickstart button lands below the sticky header (${label})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      // Instant scrolling, so the check below sees where the jump lands.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator('.cl-hero a[href="#quickstart"]').click();
      await expect(page).toHaveURL(/#quickstart$/);

      const header = await page.locator("header").first().boundingBox();
      const heading = await page.locator("#quickstart h2").boundingBox();
      // The header stays on screen, and the heading sits below it.
      expect(header?.y).toBe(0);
      expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
      await expect(page.locator("#quickstart h2")).toBeInViewport();
    });
  }

  test("a shared link to a section opens with its heading below the header", async ({
    page,
  }) => {
    // Mid-page, so the browser can bring the section all the way up: only the
    // sections' scroll margin keeps the heading out from under the header.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dark-factory");
    const heading = page.locator("#dark-factory h2");
    await expect(heading).toBeInViewport();

    const header = await page.locator("header").first().boundingBox();
    const box = await heading.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  });

  test("the quickstart sends you to the README's own steps", async ({
    page,
  }) => {
    const readme = page.locator(`#quickstart a[href="${REPO}#quick-start"]`);
    await expect(readme).toBeVisible();
    expect(await readme.getAttribute("rel")).toContain("noopener");
  });

  test("the header's logo stays on one line on a small phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const logo = await page.locator("header .nav-logo").boundingBox();
    expect(logo!.height).toBeLessThan(45);
  });

  test("shows the library counts with their source", async ({ page }) => {
    const counts = page.locator(".cl-counts dd");
    await expect(counts.first()).toBeVisible();
    for (const value of await counts.allTextContents()) {
      expect(value).toMatch(/^\d+$/);
    }
    await expect(page.locator(`.cl-source a[href^="${REPO}/blob/"]`)).toBeVisible();
  });

  test("hands the reader on to the personal page", async ({ page }) => {
    await page.locator('.cl-hero a[href="/about"]').click();
    await expect(page).toHaveURL("/about");
    await expect(page.locator(".profile-photo")).toBeVisible();
  });
});
