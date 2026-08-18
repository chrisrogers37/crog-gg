import { test, expect } from "@playwright/test";

/**
 * Navigation E2E Tests
 *
 * Philosophy: Test navigation behavior and page structure.
 * Don't depend on specific content or data loading.
 */

test.describe("Site Navigation", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");
    // Page should have loaded without error
    await expect(page.locator("body")).toBeVisible();
    // Should have main content area
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("projects page is accessible", async ({ page }) => {
    await page.goto("/projects");
    // Should have a heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can navigate between pages using links", async ({ page }) => {
    // Start on projects page (has navigation header)
    await page.goto("/projects");

    // The nav logo is repo-shipped structure, not optional data, so it is
    // required. Guarding this on a one-shot isVisible() meant the test passed
    // having asserted nothing whenever the link failed to render.
    const homeLink = page
      .locator('a[href="/"], .nav-logo, [class*="logo"]')
      .first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("404 Page", () => {
  test("displays 404 for non-existent routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");

    // Should show some indication this page doesn't exist
    const notFoundIndicators = page.locator(
      '.not-found, [class*="not-found"], [class*="404"], h1:has-text("404")',
    );
    await expect(notFoundIndicators.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Layout Components", () => {
  test("header is present on projects page", async ({ page }) => {
    await page.goto("/projects");
    // Projects page should have header/nav
    const header = page.locator("header, nav, .navigation");
    await expect(header.first()).toBeVisible();
  });

  test("main content area exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/projects");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("External Links", () => {
  test("social links open in new tab", async ({ page }) => {
    await page.goto("/");

    // Home ships social links, and home.spec.ts already requires them to be
    // visible, so a count-gate here was inconsistent with the suite next to it.
    // Worse, this is a security assertion: under the gate, removing every
    // target="_blank" made the rel="noopener" check silently stop running
    // instead of failing, which is the one outcome it exists to prevent.
    const externalLinks = page.locator('a[target="_blank"]');
    await expect(externalLinks.first()).toBeVisible();

    const rel = await externalLinks.first().getAttribute("rel");
    expect(rel).toContain("noopener");
  });
});

test.describe("Mobile Menu", () => {
  test("mobile menu opens and closes", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Find and click hamburger
    const hamburger = page.locator(".home-hamburger");
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Menu should be visible
    const menu = page.locator(".mobile-menu");
    await expect(menu).toBeVisible({ timeout: 3000 });

    // Close button should work
    const closeBtn = page.locator(".mobile-menu-close");
    await closeBtn.click();
    await expect(menu).not.toBeVisible();
  });

  test("mobile menu section navigation works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Open menu
    await page.locator(".home-hamburger").click();

    // Click a section
    const journeyBtn = page.locator(".mobile-menu-section-btn", {
      hasText: "journey",
    });
    await journeyBtn.click();

    // Menu should close
    await expect(page.locator(".mobile-menu")).not.toBeVisible();

    // Timeline should be visible
    const timeline = page.locator(".timeline-container");
    await expect(timeline).toBeVisible({ timeout: 5000 });
  });

  test("hamburger hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const hamburger = page.locator(".home-hamburger");
    await expect(hamburger).not.toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still render main elements
    await expect(
      page.locator('h1, .profile-name, [class*="name"]').first(),
    ).toBeVisible();
  });

  test("page renders on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(
      page.locator('h1, .profile-name, [class*="name"]').first(),
    ).toBeVisible();
  });

  test("projects page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects");

    // Should show heading
    await expect(page.locator("h1")).toBeVisible();

    // Projects ship with the repo, so the search input is required rather than
    // conditional. The old gate asserted visibility only after establishing it,
    // which could not fail either way: absent, it skipped the assertion;
    // present, it re-checked what the guard had just read.
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Page Load Performance", () => {
  test("home page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");

    // Wait for main content
    await expect(page.locator("h1").first()).toBeVisible();

    const loadTime = Date.now() - startTime;
    // Page should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });

  test("projects page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/projects");

    await expect(page.locator("h1")).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe("see more survives a collapse (#165)", () => {
  test("expand, collapse, expand again", async ({ page }) => {
    await page.goto("/");

    // First expansion. This is the POSITIVE CONTROL: without it the test
    // would also pass on a page where "see more" never worked at all.
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.click(".section-fade-btn");
    await expect(page.locator(".generate-btn")).toBeVisible({ timeout: 10000 });

    // Collapse the way a reader does -- clicking the tab that is already
    // active. SectionNav reports that as an empty section id.
    await page.locator(".section-nav-button.active").first().click();
    await expect(page.locator(".section-fade-btn")).toBeVisible({
      timeout: 10000,
    });

    // The regression: from here "see more" still rendered and still took
    // clicks, but changed nothing, and SUMMON NEW LORE was gone with it. So
    // both halves are asserted -- the control has to work AND has to put the
    // reader back somewhere that has the primary action on it.
    await page.click(".section-fade-btn");
    await expect(page.locator(".generate-btn")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".section-content")).toBeVisible();
  });
});
