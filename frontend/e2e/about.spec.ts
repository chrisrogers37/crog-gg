import { test, expect } from "@playwright/test";
import { LANDING, SECTIONS, TABS_PATH, named, withLongAbout } from "./site";

/**
 * About Page E2E Tests (the personal page, which was the homepage until #173)
 *
 * Philosophy: Test structure and behavior, not specific content.
 * Content may change frequently - tests should verify the page works,
 * not that it contains exact copy.
 */

// The tabs a test steps through: the second and third, since the first is
// selected on load, and the last. A site with fewer skips what needs more.
const [, SECOND, THIRD] = SECTIONS;
const LAST = SECTIONS[SECTIONS.length - 1];

test.beforeEach(async ({ page }) => {
  await withLongAbout(page);
  await page.goto(TABS_PATH);
});

test.describe("About Page", () => {
  test("displays profile section with name heading", async ({ page }) => {
    // Test that a main heading exists (the name), not its exact content
    const mainHeading = page.locator("h1").first();
    await expect(mainHeading).toBeVisible();
  });

  test("displays location information", async ({ page }) => {
    // The contact card's location line, whatever city it names.
    await expect(page.locator(".contact-location")).toBeVisible();
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

    // One tab per section site.yaml lists
    await expect(sectionTabs).toHaveCount(SECTIONS.length);
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
    test.skip(!LANDING || !SECOND, "needs the landing page to leave for, and a second tab");
    // The open tab is the page's own state; this guards against it moving
    // back to a global store, which outlived the page.
    await page.getByRole("tab", { name: named(SECOND.label) }).click();
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
    // Not the default tab: the collapsed preview is already a panel (About's),
    // so only a panel named for the clicked tab proves the switch.
    test.skip(!SECOND, "needs a second tab");
    await page.getByRole("tab", { name: named(SECOND.label) }).click();
    await expect(
      page.getByRole("tabpanel", { name: named(SECOND.label) }),
    ).toBeVisible();
  });

  test("clicking same section twice toggles it off", async ({ page }) => {
    test.skip(!SECOND, "needs a second tab");
    const journeyButton = page.locator(`button[data-section="${SECOND.id}"]`);

    // Click journey to activate it
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
    test.skip(!SECOND, "needs a second tab");
    const journeyButton = page.locator(`button[data-section="${SECOND.id}"]`);

    // Journey starts inactive (about is auto-selected on mount)
    await expect(journeyButton).not.toHaveClass(/active/);

    // Click to activate
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);
  });

  test("switching sections deactivates previous", async ({ page }) => {
    test.skip(!THIRD, "needs three tabs");
    const journeyButton = page.locator(`button[data-section="${SECOND.id}"]`);
    const projectsButton = page.locator(`button[data-section="${THIRD.id}"]`);

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
    const projects = SECTIONS.find(({ id }) => id === "projects");
    test.skip(!projects, "the site has no Projects tab");
    await page.getByRole("tab", { name: named(projects!.label) }).click();
    const card = page.locator(".projects-section a.project-tile").first();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe("Section Flow Navigation", () => {
  test("section navigator shows next section", async ({ page }) => {
    test.skip(!THIRD, "needs a tab after the second");
    // The second tab (not auto-selected, avoids preview mode)
    await page.locator(`button[data-section="${SECOND.id}"]`).click();

    // Check for navigator
    const navigator = page.locator(".section-navigator");
    await expect(navigator).toBeVisible({ timeout: 5000 });

    // Should show "up next" text
    await expect(navigator).toContainText(/up next/i);
  });

  test("section navigator not shown on last section", async ({ page }) => {
    test.skip(SECTIONS.length < 2, "needs a last tab that isn't the first");
    await page.locator(`button[data-section="${LAST.id}"]`).click();

    // Wait for the section's content to render
    await expect(page.getByRole("tabpanel", { name: named(LAST.label) })).toBeVisible();

    // Navigator should not be visible
    const navigator = page.locator(".section-navigator");
    await expect(navigator).not.toBeVisible();
  });

  test("clicking section navigator switches section", async ({ page }) => {
    test.skip(!THIRD, "needs a tab after the second");
    // The second tab (not auto-selected, avoids preview mode)
    await page.locator(`button[data-section="${SECOND.id}"]`).click();

    // Wait for navigator to appear
    const navigatorBtn = page.locator(".section-navigator-btn");
    await expect(navigatorBtn).toBeVisible({ timeout: 5000 });

    // Click the navigator
    await navigatorBtn.click();

    // The next tab is now active
    const projectsButton = page.locator(`button[data-section="${THIRD.id}"]`);
    await expect(projectsButton).toHaveClass(/active/);
  });
});

test.describe("Action Buttons", () => {
  test("action buttons appear when section is active", async ({ page }) => {
    test.skip(!SECOND, "needs a second tab");
    // The second tab (not auto-selected, avoids preview mode)
    await page.locator(`button[data-section="${SECOND.id}"]`).click();

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
