import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays profile information', async ({ page }) => {
    // Check that the profile name is visible
    await expect(page.getByRole('heading', { name: /Christopher T\. Rogers/i })).toBeVisible();

    // Check location is displayed
    await expect(page.getByText(/New York City/i)).toBeVisible();

    // Check email is displayed
    await expect(page.getByText(/christophertrogers37@gmail.com/i)).toBeVisible();
  });

  test('displays welcome message', async ({ page }) => {
    // Wait for typewriter effect - first message is "hey there!"
    await expect(page.getByText(/hey there/i)).toBeVisible({ timeout: 10000 });
  });

  test('displays section navigation buttons', async ({ page }) => {
    // Check all section nav buttons are visible
    await expect(page.getByRole('button', { name: /About/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Experience/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Skills/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Education/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Projects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Music/i })).toBeVisible();
  });

  test('has LinkedIn link', async ({ page }) => {
    const linkedInLink = page.getByRole('link', { name: /LinkedIn/i });
    await expect(linkedInLink).toBeVisible();
    await expect(linkedInLink).toHaveAttribute('href', 'https://www.linkedin.com/in/chrisrogers37/');
  });
});

test.describe('Section Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking About section displays about content', async ({ page }) => {
    // Click About section button
    await page.getByRole('button', { name: /About/i }).click();

    // Wait for content to appear
    await expect(page.getByText(/alright, here goes/i)).toBeVisible({ timeout: 5000 });
  });

  test('clicking Experience section displays experience content', async ({ page }) => {
    // Click Experience section button
    await page.getByRole('button', { name: /Experience/i }).click();

    // Experience section should show work history
    await expect(page.locator('.experience-section, .section-content')).toBeVisible({ timeout: 5000 });
  });

  test('clicking Skills section displays skills content', async ({ page }) => {
    // Click Skills section button
    await page.getByRole('button', { name: /Skills/i }).click();

    // Skills section should be visible (uses .skills-container class)
    await expect(page.locator('.skills-container, .skills-bar-chart')).toBeVisible({ timeout: 5000 });
  });

  test('clicking same section twice hides it', async ({ page }) => {
    const aboutButton = page.getByRole('button', { name: /About/i });

    // First click - show section
    await aboutButton.click();
    await expect(page.getByText(/alright, here goes/i)).toBeVisible({ timeout: 5000 });

    // Second click - hide section
    await aboutButton.click();
    await expect(page.getByText(/alright, here goes/i)).not.toBeVisible({ timeout: 5000 });
  });

  test('switching between sections works correctly', async ({ page }) => {
    // Click About section
    await page.getByRole('button', { name: /About/i }).click();
    await expect(page.getByText(/alright, here goes/i)).toBeVisible({ timeout: 5000 });

    // Switch to Experience section
    await page.getByRole('button', { name: /Experience/i }).click();

    // About content should be hidden, Experience should be visible
    await expect(page.getByText(/alright, here goes/i)).not.toBeVisible();
  });

  test('active section button has active class', async ({ page }) => {
    const aboutButton = page.getByRole('button', { name: /About/i });

    // Initially not active
    await expect(aboutButton).not.toHaveClass(/active/);

    // Click to activate
    await aboutButton.click();
    await expect(aboutButton).toHaveClass(/active/);

    // Click again to deactivate
    await aboutButton.click();
    await expect(aboutButton).not.toHaveClass(/active/);
  });
});

test.describe('Action Buttons', () => {
  test('action buttons appear when section is selected', async ({ page }) => {
    await page.goto('/');

    // Click About section to activate
    await page.getByRole('button', { name: /About/i }).click();

    // Wait for content to load
    await expect(page.getByText(/alright, here goes/i)).toBeVisible({ timeout: 5000 });

    // Action buttons should be visible (SUMMON NEW LORE and DISPEL ENCHANTMENT)
    await expect(page.getByRole('button', { name: /SUMMON NEW LORE/i })).toBeVisible();
  });

  test('action buttons hidden when no section selected', async ({ page }) => {
    await page.goto('/');

    // No section is selected initially, action buttons should not be visible
    await expect(page.getByRole('button', { name: /SUMMON NEW LORE/i })).not.toBeVisible();
  });
});
