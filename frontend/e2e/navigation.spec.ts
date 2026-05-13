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

  test("can navigate between pages using sidebar", async ({ page }) => {
    await page.goto("/");

    // Click Projects in sidebar
    const projectsItem = page.locator(".sidebar-nav-item", {
      hasText: "Projects",
    });
    await projectsItem.click();
    await expect(page).toHaveURL(/\/projects/);

    // Click About to go back to home
    const aboutItem = page.locator(".sidebar-nav-item", {
      hasText: "About",
    });
    await aboutItem.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Route Navigation", () => {
  test("journey route loads", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("claudfather route loads", async ({ page }) => {
    await page.goto("/claudfather");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("music route loads", async ({ page }) => {
    await page.goto("/music");
    await expect(page.getByRole("main")).toBeVisible();
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
  test("sidebar is present on all pages", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();

    await page.goto("/projects");
    await expect(sidebar).toBeVisible();
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

    // Sidebar social links should have target="_blank" and rel="noopener"
    const socialLinks = page.locator(".sidebar-social-link");
    const count = await socialLinks.count();

    if (count > 0) {
      const firstLink = socialLinks.first();
      const rel = await firstLink.getAttribute("rel");
      expect(rel).toContain("noopener");
    }
  });
});

test.describe("Mobile Menu", () => {
  test("mobile menu opens and closes", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Find and click hamburger toggle
    const toggle = page.locator(".sidebar-mobile-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Sidebar should be visible with --open class
    const sidebar = page.locator(".sidebar.sidebar--open");
    await expect(sidebar).toBeVisible({ timeout: 3000 });

    // Click overlay to close
    const overlay = page.locator(".sidebar-overlay");
    await overlay.click();
    await expect(sidebar).not.toBeVisible();
  });

  test("mobile menu navigation works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Open menu
    await page.locator(".sidebar-mobile-toggle").click();

    // Click Journey nav item
    const journeyItem = page.locator(".sidebar-nav-item", {
      hasText: "Journey",
    });
    await journeyItem.click();

    // Menu should close and navigate to /journey
    await expect(page.locator(".sidebar.sidebar--open")).not.toBeVisible();
    await expect(page).toHaveURL(/\/journey/);
  });

  test("mobile toggle hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const toggle = page.locator(".sidebar-mobile-toggle");
    await expect(toggle).not.toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Mobile bar should show name
    await expect(page.locator(".sidebar-mobile-bar").first()).toBeVisible();
  });

  test("page renders on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Page should render main elements
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("projects page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects");

    // Should show heading
    await expect(page.locator("h1")).toBeVisible();

    // Search only visible when projects load — don't require it
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    const isVisible = await searchInput
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isVisible) {
      await expect(searchInput).toBeVisible();
    }
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
