import { test, expect } from "@playwright/test";

/**
 * About Page E2E Tests (the personal page, which was the homepage until #173)
 *
 * Philosophy: Test structure and behavior, not specific content.
 * Content may change frequently - tests should verify the page works,
 * not that it contains exact copy.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/about");
});

test.describe("About Page", () => {
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
    // The section nav is a tablist with a tab per section
    const sectionTabs = page.getByRole("tablist").getByRole("tab");
    await expect(sectionTabs.first()).toBeVisible();

    // Should have multiple section tabs
    const count = await sectionTabs.count();
    expect(count).toBeGreaterThan(3);
  });

  test("displays tagline in header", async ({ page }) => {
    const tagline = page.locator(".header-tagline");
    await expect(tagline).toBeVisible({ timeout: 5000 });
  });

  test("has social links", async ({ page }) => {
    // The page's own: the site header links out too, and renders first.
    const socialLinks = page.locator('.about-page a[target="_blank"]');
    await expect(socialLinks.first()).toBeVisible();
  });

  test("lands on About's preview whatever tab was open before", async ({
    page,
  }) => {
    // The open tab is the page's own state; this guards against it moving
    // back to a global store, which outlived the page.
    await page.getByRole("tab", { name: /journey/i }).click();
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator('header a[href="/about"]').first().click();
    await expect(page).toHaveURL(/\/about$/);

    const about = page.getByRole("tab", { name: /^about$/i });
    await expect(about).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: /see more/i }).click();
    await expect(about).toHaveAttribute("aria-selected", "true");
  });

});

test.describe("Section Navigation", () => {
  test("clicking a section tab shows that section's panel", async ({ page }) => {
    // Not the default tab, so the panel has to change. (The collapsed preview
    // is already a panel, labelled by the About tab, so "a panel is visible"
    // would pass even if the click did nothing.)
    const tab = page.locator('[role="tab"][data-section="journey"]');
    const tabName = (await tab.textContent())?.trim() ?? "";
    expect(tabName).not.toBe("");
    await tab.click();

    const panel = page.getByRole("tabpanel");
    await expect(panel).toHaveAccessibleName(tabName, { timeout: 5000 });
    await expect(panel).toBeVisible();
  });

  test("clicking same section twice toggles it off", async ({ page }) => {
    const journeyButton = page.locator('button[data-section="journey"]');

    // Click journey to activate it (toHaveClass waits for the change)
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);

    // Click journey again - should deactivate it
    await journeyButton.click();
    await expect(journeyButton).not.toHaveClass(/active/);
  });

  test("the highlighted About tab expands on the first click (#196 M66)", async ({
    page,
  }) => {
    const about = page.getByRole("tab", { name: /^about$/i });
    await expect(about).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: /see more/i })).toBeVisible();

    await about.click();

    // Expanded: the preview's "see more" is gone, and the action buttons that
    // mount with the expanded content are there.
    await expect(page.getByRole("button", { name: /see more/i })).toHaveCount(0);
    await expect(page.locator(".action-buttons")).toBeVisible();
    await expect(about).toHaveAttribute("aria-selected", "true");
  });

  test("section buttons show active state when clicked", async ({ page }) => {
    const journeyButton = page.locator('button[data-section="journey"]');

    // Journey starts inactive (about is auto-selected on mount)
    await expect(journeyButton).not.toHaveClass(/active/);

    // Click to activate
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);
  });

  test("switching sections deactivates previous", async ({ page }) => {
    const journeyButton = page.locator('button[data-section="journey"]');
    const projectsButton = page.locator('button[data-section="projects"]');

    // Click journey (not auto-selected, so clean activation)
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);

    // Click projects
    await projectsButton.click();

    // Journey should no longer be active
    await expect(journeyButton).not.toHaveClass(/active/);
    await expect(projectsButton).toHaveClass(/active/);
  });
});

test.describe("Projects tab", () => {
  test("its cards open their pages on the site (#196 M43)", async ({ page }) => {
    await page.getByRole("tab", { name: /^projects$/i }).click();
    const card = page.locator(".projects-section a.project-tile").first();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe("Section Flow Navigation", () => {
  test("section navigator shows next section", async ({ page }) => {
    // Click journey (not auto-selected, avoids preview mode)
    await page.locator('button[data-section="journey"]').click();

    // Check for navigator
    const navigator = page.locator(".section-navigator");
    await expect(navigator).toBeVisible({ timeout: 5000 });

    // Should show "up next" text
    await expect(navigator).toContainText(/up next/i);
  });

  test("section navigator not shown on last section", async ({ page }) => {
    // Click Music tab (last section)
    await page.locator('button[data-section="music"]').click();

    // Wait for the section's content to render
    await expect(page.locator(".music-section")).toBeVisible();

    // Navigator should not be visible
    const navigator = page.locator(".section-navigator");
    await expect(navigator).not.toBeVisible();
  });

  test("clicking section navigator switches section", async ({ page }) => {
    // Click journey (not auto-selected, avoids preview mode)
    await page.locator('button[data-section="journey"]').click();

    // Wait for navigator to appear
    const navigatorBtn = page.locator(".section-navigator-btn");
    await expect(navigatorBtn).toBeVisible({ timeout: 5000 });

    // Click the navigator
    await navigatorBtn.click();

    // Projects tab should now be active (next after journey)
    const projectsButton = page.locator('button[data-section="projects"]');
    await expect(projectsButton).toHaveClass(/active/);
  });
});

test.describe("Action Buttons", () => {
  test("action buttons appear when section is active", async ({ page }) => {

    // Click journey (not auto-selected, avoids preview mode)
    await page.locator('button[data-section="journey"]').click();

    // Action buttons should appear
    const actionButtons = page.locator(
      '.action-buttons button, [class*="action"] button',
    );

    // Wait for action buttons (may take a moment to appear)
    await expect(actionButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test("action buttons hidden when no section active", async ({ page }) => {

    // Without clicking any section, action buttons should not be visible
    const actionButtons = page.locator(
      '.action-buttons, [class*="action-buttons"]',
    );
    await expect(actionButtons).not.toBeVisible();
  });
});

test.describe("Contact CTA", () => {
  test("displays contact CTA section", async ({ page }) => {
    const cta = page.locator(".contact-cta");
    await expect(cta).toBeVisible({ timeout: 5000 });

    // Check that email link exists
    const emailLink = cta.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
  });

  test("about page has footer", async ({ page }) => {
    const footer = page.locator("footer.footer");
    await expect(footer).toBeVisible({ timeout: 5000 });
  });
});
