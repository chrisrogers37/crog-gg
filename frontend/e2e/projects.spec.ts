import { test, expect } from '@playwright/test';

/**
 * Projects Page E2E Tests
 *
 * Philosophy: Test page structure and behavior, not content.
 * Projects data comes from YAML files and may not load in all environments.
 * Tests should verify the page works, gracefully handling missing data.
 */

test.describe('Projects Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('displays page header', async ({ page }) => {
    // Page should have a main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('displays search input', async ({ page }) => {
    // Search functionality should exist
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]');
    await expect(searchInput).toBeVisible();
  });

  test('displays filter buttons', async ({ page }) => {
    // Category filter buttons should exist
    const filterButtons = page.locator('.category-button, .category-filters button');
    await expect(filterButtons.first()).toBeVisible();
  });

  test('search input accepts text', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]');
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });
});

test.describe('Projects Page with Data', () => {
  // These tests check behavior when projects are loaded
  // They gracefully skip if projects aren't available

  test('project cards link to detail pages when present', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Check if any project cards loaded
    const projectCards = page.locator('.project-list-card, [class*="project-card"]');
    const hasProjects = await projectCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasProjects) {
      // Verify cards are links
      const firstCard = projectCards.first();
      const tagName = await firstCard.evaluate((el) => el.tagName.toLowerCase());
      const isLink = tagName === 'a' || (await firstCard.locator('a').count()) > 0;
      expect(isLink).toBe(true);
    } else {
      // No projects loaded - this is OK, page structure was tested above
      test.skip();
    }
  });

  test('clicking project card navigates to detail', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const projectCards = page.locator('.project-list-card, [class*="project-card"]');
    const hasProjects = await projectCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasProjects) {
      await projectCards.first().click();
      // Should navigate to a project detail URL
      await expect(page).toHaveURL(/\/projects\/.+/);
    } else {
      test.skip();
    }
  });
});

test.describe('Projects Filtering Behavior', () => {
  test('filter buttons toggle active state', async ({ page }) => {
    await page.goto('/projects');

    const filterButtons = page.locator('.category-button, .category-filters button');
    const count = await filterButtons.count();

    if (count > 1) {
      const secondButton = filterButtons.nth(1);

      // Click second filter button
      await secondButton.click();

      // It should become active
      const hasActiveClass = await secondButton.evaluate((el) =>
        el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true'
      );
      expect(hasActiveClass).toBe(true);
    }
  });

  test('search clears properly', async ({ page }) => {
    await page.goto('/projects');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]');

    // Type something
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');

    // Clear it
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
  });

  test('no results state shows message or empty grid', async ({ page }) => {
    await page.goto('/projects');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]');

    // Search for something that won't match
    await searchInput.fill('xyznonexistent123456789');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should either show "no results" message OR have zero project cards
    const noResults = page.locator('.no-results, [class*="no-results"], [class*="empty"]');
    const projectCards = page.locator('.project-list-card, [class*="project-card"]');

    const hasNoResultsMessage = await noResults.isVisible().catch(() => false);
    const cardCount = await projectCards.count();

    // Either shows message or has no cards
    expect(hasNoResultsMessage || cardCount === 0).toBe(true);
  });
});

test.describe('Project Detail Page', () => {
  test('detail page has back navigation', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const projectCards = page.locator('.project-list-card, [class*="project-card"]');
    const hasProjects = await projectCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasProjects) {
      await projectCards.first().click();
      await expect(page).toHaveURL(/\/projects\/.+/);

      // Should have some way to go back (breadcrumb, back link, etc.)
      const backNav = page.locator('a[href="/projects"], a[href*="projects"]:not([href*="/projects/"])');
      await expect(backNav.first()).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('non-existent project shows error or redirects', async ({ page }) => {
    await page.goto('/projects/this-project-does-not-exist-12345');

    // Should either show 404/not found OR redirect to projects list
    const notFound = page.locator('.not-found, .project-not-found, [class*="not-found"], [class*="error"]');
    const projectsHeading = page.locator('h1');

    await page.waitForTimeout(1000);

    const showsError = await notFound.isVisible().catch(() => false);
    const currentUrl = page.url();
    const redirected = currentUrl.endsWith('/projects') || currentUrl.endsWith('/projects/');

    expect(showsError || redirected).toBe(true);
  });
});
