import { test, expect } from "@playwright/test";

/**
 * Home Page E2E Tests
 *
 * Philosophy: Test structure and behavior, not specific content.
 * Content may change frequently - tests should verify the page works,
 * not that it contains exact copy.
 */

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays profile section with name heading", async ({ page }) => {
    // Test that a main heading exists (the name), not its exact content
    const mainHeading = page.locator("h1").first();
    await expect(mainHeading).toBeVisible();
  });

  test("displays location information", async ({ page }) => {
    // Test that location text exists (city name visible on page)
    await expect(
      page.getByText(/New York|NYC|Location/i).first(),
    ).toBeVisible();
  });

  test("displays contact information", async ({ page }) => {
    // Test that email link exists (mailto: link)
    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
  });

  test("displays typewriter or welcome section", async ({ page }) => {
    // Test that some welcome/typewriter element exists
    // Don't test specific text since it cycles and changes
    const welcomeArea = page
      .locator(".welcome-typewriter, .typewriter")
      .first();
    await expect(welcomeArea).toBeVisible({ timeout: 5000 });
  });

  test("displays section navigation buttons", async ({ page }) => {
    // Test that section nav buttons exist
    const sectionButtons = page.locator(
      ".section-nav button, .section-buttons button",
    );
    await expect(sectionButtons.first()).toBeVisible();

    // Should have multiple section buttons
    const count = await sectionButtons.count();
    expect(count).toBeGreaterThan(3);
  });

  test("displays tagline in header", async ({ page }) => {
    const tagline = page.locator(".header-tagline");
    await expect(tagline).toBeVisible({ timeout: 5000 });
  });

  test("has social links", async ({ page }) => {
    // Test that external social links exist
    const socialLinks = page.locator('a[target="_blank"]');
    await expect(socialLinks.first()).toBeVisible();
  });
});

test.describe("Section Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("clicking a section button reveals content", async ({ page }) => {
    // Find any section button and click it
    const sectionButton = page
      .locator(".section-nav button, .section-buttons button")
      .first();
    await sectionButton.click();

    // Some content area should become visible
    const contentArea = page
      .locator('.section-content, .portfolio-section, [class*="section"]')
      .first();
    await expect(contentArea).toBeVisible({ timeout: 5000 });
  });

  test("clicking same section twice toggles it", async ({ page }) => {
    const sectionButton = page
      .locator(".section-nav button, .section-buttons button")
      .first();

    // First click - opens section
    await sectionButton.click();
    await page.waitForTimeout(500);

    // Get initial state
    const wasActive = await sectionButton.evaluate((el) =>
      el.classList.contains("active"),
    );
    expect(wasActive).toBe(true);

    // Second click - closes section
    await sectionButton.click();
    await page.waitForTimeout(500);

    const isActive = await sectionButton.evaluate((el) =>
      el.classList.contains("active"),
    );
    expect(isActive).toBe(false);
  });

  test("section buttons show active state when clicked", async ({ page }) => {
    const sectionButton = page
      .locator(".section-nav button, .section-buttons button")
      .first();

    // Initially not active
    await expect(sectionButton).not.toHaveClass(/active/);

    // Click to activate
    await sectionButton.click();
    await expect(sectionButton).toHaveClass(/active/);
  });

  test("switching sections deactivates previous", async ({ page }) => {
    const buttons = page.locator(
      ".section-nav button, .section-buttons button",
    );
    const firstButton = buttons.first();
    const secondButton = buttons.nth(1);

    // Click first button
    await firstButton.click();
    await expect(firstButton).toHaveClass(/active/);

    // Click second button
    await secondButton.click();

    // First should no longer be active
    await expect(firstButton).not.toHaveClass(/active/);
    await expect(secondButton).toHaveClass(/active/);
  });
});

test.describe("Section Flow Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("section navigator shows next section", async ({ page }) => {
    // Click About tab
    await page.locator('button[data-section="about"]').click();

    // Check for navigator
    const navigator = page.locator(".section-navigator");
    await expect(navigator).toBeVisible({ timeout: 5000 });

    // Should show "up next" text
    await expect(navigator).toContainText(/up next/i);
  });

  test("section navigator not shown on last section", async ({ page }) => {
    // Click Music tab (last section)
    await page.locator('button[data-section="music"]').click();

    // Wait for section content to render
    await page.waitForTimeout(1000);

    // Navigator should not be visible
    const navigator = page.locator(".section-navigator");
    await expect(navigator).not.toBeVisible();
  });

  test("clicking section navigator switches section", async ({ page }) => {
    // Click About tab
    await page.locator('button[data-section="about"]').click();

    // Wait for navigator to appear
    const navigatorBtn = page.locator(".section-navigator-btn");
    await expect(navigatorBtn).toBeVisible({ timeout: 5000 });

    // Click the navigator
    await navigatorBtn.click();

    // Journey tab should now be active
    const journeyButton = page.locator('button[data-section="journey"]');
    await expect(journeyButton).toHaveClass(/active/);
  });
});

test.describe("Action Buttons", () => {
  test("action buttons appear when section is active", async ({ page }) => {
    await page.goto("/");

    // Click a section to activate it
    const sectionButton = page
      .locator(".section-nav button, .section-buttons button")
      .first();
    await sectionButton.click();

    // Action buttons should appear
    const actionButtons = page.locator(
      '.action-buttons button, [class*="action"] button',
    );

    // Wait for action buttons (may take a moment to appear)
    await expect(actionButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test("action buttons hidden when no section active", async ({ page }) => {
    await page.goto("/");

    // Without clicking any section, action buttons should not be visible
    const actionButtons = page.locator(
      '.action-buttons, [class*="action-buttons"]',
    );
    await expect(actionButtons).not.toBeVisible();
  });
});

test.describe("Contact CTA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays contact CTA section", async ({ page }) => {
    const cta = page.locator(".contact-cta");
    await expect(cta).toBeVisible({ timeout: 5000 });

    // Check that email link exists
    const emailLink = cta.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
  });

  test("homepage has footer", async ({ page }) => {
    const footer = page.locator("footer.footer");
    await expect(footer).toBeVisible({ timeout: 5000 });
  });
});
