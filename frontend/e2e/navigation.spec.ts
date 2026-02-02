import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 *
 * Philosophy: Test navigation behavior and page structure.
 * Don't depend on specific content or data loading.
 */

test.describe('Site Navigation', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');
    // Page should have loaded without error
    await expect(page.locator('body')).toBeVisible();
    // Should have main content area
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('projects page is accessible', async ({ page }) => {
    await page.goto('/projects');
    // Should have a heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can navigate between pages using links', async ({ page }) => {
    // Start on projects page (has navigation header)
    await page.goto('/projects');

    // Find home/logo link
    const homeLink = page.locator('a[href="/"], .nav-logo, [class*="logo"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('404 Page', () => {
  test('displays 404 for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');

    // Should show some indication this page doesn't exist
    const notFoundIndicators = page.locator(
      '.not-found, [class*="not-found"], [class*="404"], h1:has-text("404")'
    );
    await expect(notFoundIndicators.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Layout Components', () => {
  test('header is present on projects page', async ({ page }) => {
    await page.goto('/projects');
    // Projects page should have header/nav
    const header = page.locator('header, nav, .navigation');
    await expect(header.first()).toBeVisible();
  });

  test('main content area exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('External Links', () => {
  test('social links open in new tab', async ({ page }) => {
    await page.goto('/');

    // Find any external link
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    if (count > 0) {
      // External links should have rel="noopener" or similar for security
      const firstLink = externalLinks.first();
      const rel = await firstLink.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});

test.describe('Responsive Design', () => {
  test('page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still render main elements
    await expect(page.locator('h1, .profile-name, [class*="name"]').first()).toBeVisible();
  });

  test('page renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('h1, .profile-name, [class*="name"]').first()).toBeVisible();
  });

  test('projects page renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Should show heading and search
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="search"], input[placeholder*="earch"]')).toBeVisible();
  });
});

test.describe('Page Load Performance', () => {
  test('home page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for main content
    await expect(page.locator('h1').first()).toBeVisible();

    const loadTime = Date.now() - startTime;
    // Page should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });

  test('projects page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/projects');

    await expect(page.locator('h1')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});
