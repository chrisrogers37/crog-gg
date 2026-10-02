import { test, expect } from "./fixtures";
import {
  ABOUT,
  OTHER_TABS,
  SECTIONS,
  SUMMON,
  TABS_PATH,
  bio,
  named,
  site,
  tabAfter,
  withLongAbout,
} from "./site";

/**
 * About Page E2E Tests (the personal page, which was the homepage until #173)
 *
 * Philosophy: Test structure and behavior, not specific content.
 * Content may change frequently - tests should verify the page works,
 * not that it contains exact copy.
 */

// The tabs a test steps through: two that aren't About, which is selected on
// load, and the last. A site with fewer skips what needs more.
const [SECOND, THIRD] = OTHER_TABS;
const LAST = SECTIONS[SECTIONS.length - 1];

// A test that opens or measures About's preview is tagged @preview: a site's
// own About copy may be too short to overflow it.
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.tags.includes("@preview")) await withLongAbout(page);
  await page.goto(TABS_PATH);
});

test.describe("About Page", () => {
  test("displays profile section with name heading", async ({ page }) => {
    // Test that a main heading exists (the name), not its exact content
    const mainHeading = page.locator("h1").first();
    await expect(mainHeading).toBeVisible();
  });

  test("displays location information when the bio has some", async ({ page }) => {
    // The contact card's location line, whatever city it names: shown exactly
    // when bio.yaml sets one.
    const location = page.locator(".contact-location");
    await expect(page.locator(".contact-cta")).toBeVisible();
    await expect(location).toHaveCount(bio.location ? 1 : 0);
    if (bio.location) await expect(location).toBeVisible();
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

  test("lands on About's preview whatever tab was open before", { tag: "@preview" }, async ({
    page,
  }) => {
    test.skip(!SECOND, "needs a tab other than About");
    // The open tab is the page's own state; this guards against it moving
    // back to a global store, which outlived the page.
    await page.getByRole("tab", { name: named(SECOND.label) }).click();
    await page.locator('header a[href="/projects"]').first().click();
    await expect(page).toHaveURL(/\/projects$/);
    await page.locator(`header a[href="${TABS_PATH}"]`).first().click();
    await expect(page).toHaveURL((url) => url.pathname === TABS_PATH);

    const about = page.getByRole("tab", { name: named(ABOUT.label) });
    await expect(about).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: /see more/i }).click();
    await expect(about).toHaveAttribute("aria-selected", "true");
  });

});

test.describe("Section Navigation", () => {
  test("clicking a section tab shows that section's panel", async ({ page }) => {
    // Not the default tab: the collapsed preview is already a panel (About's),
    // so only a panel named for the clicked tab proves the switch.
    test.skip(!SECOND, "needs a tab other than About");
    await page.getByRole("tab", { name: named(SECOND.label) }).click();
    await expect(
      page.getByRole("tabpanel", { name: named(SECOND.label) }),
    ).toBeVisible();
  });

  test("clicking same section twice toggles it off", async ({ page }) => {
    test.skip(!SECOND, "needs a tab other than About");
    const journeyButton = page.locator(`button[data-section="${SECOND.id}"]`);

    // Click journey to activate it
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);

    // Click journey again - should deactivate it
    await journeyButton.click();
    await expect(journeyButton).not.toHaveClass(/active/);
  });

  test("the highlighted About tab expands on the first click (#196 M66)", { tag: "@preview" }, async ({
    page,
  }) => {
    const about = page.getByRole("tab", { name: named(ABOUT.label) });
    await expect(about).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: /see more/i })).toBeVisible();

    await about.click();

    // Expanded: the preview's "see more" is gone, the expanded panel is in,
    // and so are the action buttons that mount with it, where SUMMON shows.
    await expect(page.getByRole("button", { name: /see more/i })).toHaveCount(0);
    await expect(page.locator(".content-section")).toBeVisible();
    if (SUMMON) await expect(page.locator(".action-buttons")).toBeVisible();
    await expect(about).toHaveAttribute("aria-selected", "true");
  });

  test("section buttons show active state when clicked", async ({ page }) => {
    test.skip(!SECOND, "needs a tab other than About");
    const journeyButton = page.locator(`button[data-section="${SECOND.id}"]`);

    // Journey starts inactive (about is auto-selected on mount)
    await expect(journeyButton).not.toHaveClass(/active/);

    // Click to activate
    await journeyButton.click();
    await expect(journeyButton).toHaveClass(/active/);
  });

  test("switching sections deactivates previous", async ({ page }) => {
    test.skip(!THIRD, "needs two tabs other than About");
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
    test.skip(!SECOND || !tabAfter(SECOND), "needs a tab other than About, and one after it");
    // Not About (auto-selected, so in preview mode)
    await page.locator(`button[data-section="${SECOND.id}"]`).click();

    // Check for navigator
    const navigator = page.locator(".section-navigator");
    await expect(navigator).toBeVisible({ timeout: 5000 });

    // Should show "up next" text
    await expect(navigator).toContainText(/up next/i);
  });

  test("section navigator not shown on last section", async ({ page }) => {
    test.skip(LAST.id === ABOUT.id, "needs a last tab that isn't About");
    await page.locator(`button[data-section="${LAST.id}"]`).click();

    // Wait for the section's content to render
    await expect(page.getByRole("tabpanel", { name: named(LAST.label) })).toBeVisible();

    // Navigator should not be visible
    const navigator = page.locator(".section-navigator");
    await expect(navigator).not.toBeVisible();
  });

  test("clicking section navigator switches section", async ({ page }) => {
    test.skip(!SECOND || !tabAfter(SECOND), "needs a tab other than About, and one after it");
    // Not About (auto-selected, so in preview mode)
    await page.locator(`button[data-section="${SECOND.id}"]`).click();

    // Wait for navigator to appear
    const navigatorBtn = page.locator(".section-navigator-btn");
    await expect(navigatorBtn).toBeVisible({ timeout: 5000 });

    // Click the navigator
    await navigatorBtn.click();

    // The next tab is now active
    const next = page.locator(`button[data-section="${tabAfter(SECOND)!.id}"]`);
    await expect(next).toHaveClass(/active/);
  });
});

test.describe("Action Buttons", () => {
  test("action buttons appear when section is active", async ({ page }) => {
    test.skip(!SUMMON, "site.yaml turns SUMMON off");
    test.skip(!SECOND, "needs a tab other than About");
    // Not About (auto-selected, so in preview mode)
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

test.describe("Where SUMMON isn't served (#189 M21)", () => {
  // What a deployment with no OpenAI key or no Upstash answers.
  test.use({ features: { regenerate: false, github: false } });

  test("the page offers no regenerate button", async ({ page }) => {
    test.skip(site.features?.regenerate === "on", "site.yaml shows it whatever the API says");
    test.skip(!SECOND, "needs a tab other than About");
    // The panel is the node whose mount brings the buttons, so once it's in,
    // they would be too.
    await page.locator(`button[data-section="${SECOND.id}"]`).click();
    await expect(page.getByRole("tabpanel", { name: named(SECOND.label) })).toBeVisible();
    await expect(page.locator(".generate-btn")).toHaveCount(0);
  });
});
