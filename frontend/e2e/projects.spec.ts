import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('displays projects page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Projects/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/A collection of my work/i)).toBeVisible();
  });

  test('displays search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search projects/i);
    await expect(searchInput).toBeVisible();
  });

  test('displays category filter buttons', async ({ page }) => {
    // At minimum, "All" category should be visible
    await expect(page.getByRole('button', { name: /All/i })).toBeVisible();
  });

  test('displays project cards', async ({ page }) => {
    // Wait for projects to load
    const projectCards = page.locator('.project-list-card');
    await expect(projectCards.first()).toBeVisible({ timeout: 5000 });

    // Should have at least one project
    await expect(projectCards).not.toHaveCount(0);
  });

  test('project cards have links to detail pages', async ({ page }) => {
    // Wait for projects to load
    const projectCards = page.locator('.project-list-card');
    await expect(projectCards.first()).toBeVisible({ timeout: 5000 });

    // First project card should be a link
    const firstProjectLink = projectCards.first();
    const href = await firstProjectLink.getAttribute('href');
    expect(href).toMatch(/^\/projects\/.+/);
  });
});

test.describe('Projects Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    // Wait for projects to load
    await expect(page.locator('.project-list-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('search filters projects by title', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search projects/i);

    // Get initial project count
    const initialCount = await page.locator('.project-list-card').count();

    // Search for a specific term (likely to match fewer results)
    await searchInput.fill('test-search-term-unlikely-to-match');

    // Should show no results or fewer results
    const noResults = page.getByText(/No projects match/i);
    const filteredCards = page.locator('.project-list-card');

    // Either show "no results" message or fewer cards
    const hasNoResults = await noResults.isVisible().catch(() => false);
    const newCount = await filteredCards.count();

    expect(hasNoResults || newCount < initialCount || newCount === 0).toBeTruthy();
  });

  test('clearing search shows all projects again', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search projects/i);

    // Get initial count
    const initialCount = await page.locator('.project-list-card').count();

    // Search for something
    await searchInput.fill('xyz');

    // Clear the search
    await searchInput.fill('');

    // Should show same number of projects as initially
    const finalCount = await page.locator('.project-list-card').count();
    expect(finalCount).toBe(initialCount);
  });

  test('category filter changes active button', async ({ page }) => {
    const allButton = page.getByRole('button', { name: /^All$/i });

    // All should be active initially
    await expect(allButton).toHaveClass(/active/);

    // Get another category button if available
    const categoryButtons = page.locator('.category-button');
    const count = await categoryButtons.count();

    if (count > 1) {
      // Click the second category
      await categoryButtons.nth(1).click();

      // All should no longer be active
      await expect(allButton).not.toHaveClass(/active/);

      // Second button should be active
      await expect(categoryButtons.nth(1)).toHaveClass(/active/);
    }
  });

  test('clear filters button works when no results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search projects/i);

    // Search for something that won't match
    await searchInput.fill('xyznonexistent123456');

    // Check for no results message
    const noResultsSection = page.locator('.no-results');
    if (await noResultsSection.isVisible()) {
      // Click clear filters
      await page.getByRole('button', { name: /Clear filters/i }).click();

      // Projects should be visible again
      await expect(page.locator('.project-list-card').first()).toBeVisible();
    }
  });
});

test.describe('Project Detail Page', () => {
  test('navigates to project detail from listing', async ({ page }) => {
    await page.goto('/projects');

    // Wait for projects to load
    const firstProject = page.locator('.project-list-card').first();
    await expect(firstProject).toBeVisible({ timeout: 5000 });

    // Get the project title before clicking
    const projectTitle = await firstProject.locator('.card-title').textContent();

    // Click on the first project
    await firstProject.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Project title should be visible on detail page
    if (projectTitle) {
      await expect(page.getByRole('heading', { name: new RegExp(projectTitle, 'i') })).toBeVisible({ timeout: 5000 });
    }
  });

  test('project detail page has breadcrumb navigation', async ({ page }) => {
    await page.goto('/projects');

    // Navigate to first project
    const firstProject = page.locator('.project-list-card').first();
    await expect(firstProject).toBeVisible({ timeout: 5000 });
    await firstProject.click();

    // Wait for detail page to load
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Should have breadcrumb or back navigation
    const backLink = page.getByRole('link', { name: /Projects|Back/i });
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });
});
