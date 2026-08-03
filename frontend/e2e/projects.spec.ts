import { test, expect } from "@playwright/test";

/**
 * Projects Page E2E Tests
 *
 * Philosophy: Test page structure and behavior, not content.
 * Project data ships in the repo (frontend/public/content/projects/) and is
 * loaded on every route, so it is never optional: a page that renders without
 * it is a failure these tests must report, not an environment condition to
 * skip around (#120 - the skip idiom hid a live production bug).
 */

test.describe("Projects Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    // Page should have a main heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    // Search/filter UI only renders after projects load successfully
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();
  });

  test("displays filter buttons", async ({ page }) => {
    const filterButtons = page.locator(
      ".category-button, .category-filters button",
    );
    await expect(filterButtons.first()).toBeVisible();
  });

  test("search input accepts text", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });
});

test.describe("Projects Page with Data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("project cards link to detail pages", async ({ page }) => {
    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await expect(projectCards.first()).toHaveAttribute(
      "href",
      /\/projects\/.+/,
    );
  });

  test("clicking project card navigates to detail", async ({ page }) => {
    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    // Should navigate to a project detail URL
    await expect(page).toHaveURL(/\/projects\/.+/);
  });
});

test.describe("Projects Filtering Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("filter buttons toggle active state", async ({ page }) => {
    const filterButtons = page.locator(
      ".category-button, .category-filters button",
    );
    // "All" plus at least one real category; a lone button means the
    // category data vanished, which is a failure, not a variant to tolerate
    const secondButton = filterButtons.nth(1);
    await expect(secondButton).toBeVisible();

    await secondButton.click();
    await expect(secondButton).toHaveClass(/\bactive\b/);
  });

  test("search clears properly", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    // Type something
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");

    // Clear it
    await searchInput.fill("");
    await expect(searchInput).toHaveValue("");
  });

  test("no results state shows message or empty grid", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    // Search for something that won't match
    await searchInput.fill("xyznonexistent123456789");

    // Zero matches renders the no-results affordance in place of the grid
    const noResults = page.locator(
      '.no-results, [class*="no-results"], [class*="empty"]',
    );
    await expect(noResults.first()).toBeVisible();
    await expect(page.locator("a.project-tile")).toHaveCount(0);
  });
});

test.describe("Project Detail Page", () => {
  test("detail page has back navigation", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Should have some way to go back (breadcrumb, back link, etc.)
    const backNav = page.locator(
      'a[href="/projects"], a[href*="projects"]:not([href*="/projects/"])',
    );
    await expect(backNav.first()).toBeVisible();
  });

  test("non-existent project shows error or redirects", async ({ page }) => {
    await page.goto("/projects/this-project-does-not-exist-12345");

    // Should either show 404/not found OR redirect to projects list
    const notFound = page.locator(
      '.not-found, .project-not-found, [class*="not-found"], [class*="error"]',
    );
    const projectsHeading = page.locator("h1");

    await page.waitForTimeout(1000);

    const showsError = await notFound.isVisible().catch(() => false);
    const currentUrl = page.url();
    const redirected =
      currentUrl.endsWith("/projects") || currentUrl.endsWith("/projects/");

    expect(showsError || redirected).toBe(true);
  });
});
