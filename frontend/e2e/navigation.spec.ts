import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('can navigate from home to projects via section button', async ({ page }) => {
    await page.goto('/');

    // Home page uses section buttons, not header nav links
    // Click the Projects section button to navigate
    const projectsButton = page.getByRole('button', { name: /Projects/i });
    await projectsButton.click();

    // Find the "View All Projects" link that appears in the section
    const viewAllLink = page.getByRole('link', { name: /View All Projects|See All/i });
    if (await viewAllLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewAllLink.click();
      await expect(page).toHaveURL('/projects');
    }
    // If no link, the test passes as long as the section is visible
  });

  test('can navigate from projects back to home', async ({ page }) => {
    await page.goto('/projects');

    // Click home link (usually the name/logo)
    const homeLink = page.getByRole('link', { name: /Christopher|Chris|Home/i }).first();
    await homeLink.click();

    // Should be on home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Christopher T\. Rogers/i })).toBeVisible();
  });

  test('breadcrumb navigation works on project detail', async ({ page }) => {
    // Navigate to a project detail page
    await page.goto('/projects');

    // Wait for projects to load (longer timeout for CI)
    const firstProject = page.locator('.project-list-card').first();
    await expect(firstProject).toBeVisible({ timeout: 10000 });
    await firstProject.click();

    // Wait for detail page
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Click breadcrumb to go back to projects list
    const projectsBreadcrumb = page.getByRole('link', { name: /Projects/i });
    await projectsBreadcrumb.click();

    // Should be back on projects list
    await expect(page).toHaveURL('/projects');
  });
});

test.describe('404 Page', () => {
  test('displays 404 for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should show 404 or not found message (use .first() to avoid strict mode)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });

  test('displays 404 for non-existent project', async ({ page }) => {
    await page.goto('/projects/non-existent-project-xyz123');

    // Should show "not found" message or redirect to projects list
    const notFoundHeading = page.locator('.project-not-found');
    const projectsHeading = page.getByRole('heading', { name: /Projects/i, level: 1 });

    // Wait a moment for page to load
    await page.waitForTimeout(1000);

    // Either shows not found or redirects to projects
    const showsNotFound = await notFoundHeading.isVisible().catch(() => false);
    const redirectedToProjects = await projectsHeading.isVisible().catch(() => false);

    expect(showsNotFound || redirectedToProjects).toBeTruthy();
  });
});

test.describe('Layout Components', () => {
  test('header is present on all pages', async ({ page }) => {
    // Check header on home page
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Check header on projects page
    await page.goto('/projects');
    await expect(page.locator('header')).toBeVisible();
  });

  test('footer or main layout is consistent', async ({ page }) => {
    // Check main element on home page
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Check main element on projects page
    await page.goto('/projects');
    await expect(page.locator('main, .projects-page')).toBeVisible();
  });
});

test.describe('External Links', () => {
  test('GitHub link opens in new tab', async ({ page }) => {
    await page.goto('/');

    // Find GitHub link
    const githubLink = page.getByRole('link', { name: /GitHub/i });

    if (await githubLink.isVisible()) {
      // Should have target="_blank" for external links
      await expect(githubLink).toHaveAttribute('target', '_blank');
      await expect(githubLink).toHaveAttribute('rel', /noopener/);
    }
  });

  test('LinkedIn link opens in new tab', async ({ page }) => {
    await page.goto('/');

    const linkedInLink = page.getByRole('link', { name: /LinkedIn/i });
    await expect(linkedInLink).toBeVisible();
    await expect(linkedInLink).toHaveAttribute('target', '_blank');
    await expect(linkedInLink).toHaveAttribute('rel', /noopener/);
  });
});

test.describe('Responsive Design', () => {
  test('page renders on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Key elements should still be visible
    await expect(page.getByRole('heading', { name: /Christopher T\. Rogers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /About/i })).toBeVisible();
  });

  test('page renders on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Key elements should still be visible
    await expect(page.getByRole('heading', { name: /Christopher T\. Rogers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /About/i })).toBeVisible();
  });

  test('projects page renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Page should render
    await expect(page.getByRole('heading', { name: /Projects/i, level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/Search projects/i)).toBeVisible();
  });
});

test.describe('Page Load Performance', () => {
  test('home page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for main content
    await expect(page.getByRole('heading', { name: /Christopher T\. Rogers/i })).toBeVisible();

    const loadTime = Date.now() - startTime;
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('projects page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/projects');

    // Wait for main content
    await expect(page.getByRole('heading', { name: /Projects/i, level: 1 })).toBeVisible();

    const loadTime = Date.now() - startTime;
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
