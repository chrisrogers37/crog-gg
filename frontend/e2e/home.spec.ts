import { test, expect } from "@playwright/test";

/**
 * Home Page E2E Tests: Claudlobby's front door (#173)
 *
 * Philosophy: test structure and behavior, not copy. The one piece of text
 * checked is the product's name, because naming it above the fold is the
 * point of the page. Links are found by where they go.
 */

const REPO = "https://github.com/Claudfather/Claudlobby";

for (const [label, viewport] of [
  ["desktop", { width: 1366, height: 768 }],
  ["phone", { width: 390, height: 844 }],
] as const) {
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

  test("the Quickstart button jumps to the quickstart", async ({ page }) => {
    await page.locator('.cl-hero a[href="#quickstart"]').click();
    await expect(page).toHaveURL(/#quickstart$/);
    await expect(page.locator("#quickstart pre")).toBeInViewport();
  });

  test("copies the quickstart commands", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.locator("#quickstart .cl-copy").click();
    await expect(page.locator("#quickstart .cl-copy")).toHaveText(/copied/i);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(`git clone ${REPO}.git`);
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
