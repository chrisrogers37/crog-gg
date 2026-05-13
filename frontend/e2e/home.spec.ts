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

  test("displays hero section with name heading", async ({ page }) => {
    // Test that a main heading exists (the name), not its exact content
    const mainHeading = page.locator("h1").first();
    await expect(mainHeading).toBeVisible();
  });

  test("displays hero headline", async ({ page }) => {
    // Hero section has the headline "i build things that build things"
    const headline = page.locator(".hero-headline");
    await expect(headline).toBeVisible({ timeout: 5000 });
  });

  test("displays about section with bio text", async ({ page }) => {
    // Scroll to about section
    await page.locator('[data-section="about"]').scrollIntoViewIfNeeded();
    const aboutText = page.locator(".about-text");
    await expect(aboutText).toBeVisible({ timeout: 5000 });
  });

  test("displays contact link in about section", async ({ page }) => {
    // About section has a mailto link
    await page.locator('[data-section="about"]').scrollIntoViewIfNeeded();
    const emailLink = page.locator('.about-links a[href^="mailto:"]');
    await expect(emailLink).toBeVisible({ timeout: 5000 });
  });

  test("displays sidebar navigation", async ({ page }) => {
    // Fixed sidebar with nav items
    const sidebarNav = page.locator(".sidebar-nav-item");
    await expect(sidebarNav.first()).toBeVisible();

    // Should have multiple nav items (About, Journey, Projects, Claudfather, Music)
    const count = await sidebarNav.count();
    expect(count).toBeGreaterThan(3);
  });

  test("displays sidebar headline", async ({ page }) => {
    const headline = page.locator(".sidebar-headline");
    await expect(headline).toBeVisible({ timeout: 5000 });
  });

  test("has social links", async ({ page }) => {
    // Test that external social links exist in sidebar
    const socialLinks = page.locator(".sidebar-social-link");
    await expect(socialLinks.first()).toBeVisible();
  });
});

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("clicking a sidebar nav item navigates", async ({ page }) => {
    // Click Journey nav item — navigates to /journey route
    const journeyItem = page.locator(".sidebar-nav-item", {
      hasText: "Journey",
    });
    await journeyItem.click();

    // Should navigate to /journey
    await expect(page).toHaveURL(/\/journey/);
  });

  test("sidebar nav shows active state", async ({ page }) => {
    // Navigate to /projects
    await page.goto("/projects");

    // Projects nav item should have active class
    const projectsItem = page.locator(".sidebar-nav-item", {
      hasText: "Projects",
    });
    await expect(projectsItem).toHaveClass(/sidebar-nav-item--active/);
  });

  test("switching pages updates active nav item", async ({ page }) => {
    // Navigate to /journey
    await page.goto("/journey");

    const journeyItem = page.locator(".sidebar-nav-item", {
      hasText: "Journey",
    });
    await expect(journeyItem).toHaveClass(/sidebar-nav-item--active/);

    // Click Projects
    const projectsItem = page.locator(".sidebar-nav-item", {
      hasText: "Projects",
    });
    await projectsItem.click();

    // Journey should no longer be active, Projects should be
    await expect(journeyItem).not.toHaveClass(/sidebar-nav-item--active/);
    await expect(projectsItem).toHaveClass(/sidebar-nav-item--active/);
  });

  test("active nav item shows compass icon", async ({ page }) => {
    // Navigate to /projects so Projects is active
    await page.goto("/projects");

    const projectsItem = page.locator(".sidebar-nav-item", {
      hasText: "Projects",
    });
    const compass = projectsItem.locator(".sidebar-compass");
    await expect(compass).toBeVisible();
  });
});

test.describe("Scroll Sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("home page has scroll-reveal sections", async ({ page }) => {
    const sections = page.locator(".scroll-reveal-section");
    const count = await sections.count();
    // Hero, Journey, Projects, About
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("sections have data-section attributes", async ({ page }) => {
    await expect(page.locator('[data-section="hero"]')).toBeVisible();
    await expect(page.locator('[data-section="journey"]')).toBeAttached();
    await expect(page.locator('[data-section="projects"]')).toBeAttached();
    await expect(page.locator('[data-section="about"]')).toBeAttached();
  });

  test("journey section has timeline content", async ({ page }) => {
    // Scroll to journey section
    await page.locator('[data-section="journey"]').scrollIntoViewIfNeeded();
    const sectionTitle = page.locator(".section-title", { hasText: "Journey" });
    await expect(sectionTitle).toBeVisible({ timeout: 5000 });
  });

  test("projects section has content", async ({ page }) => {
    await page.locator('[data-section="projects"]').scrollIntoViewIfNeeded();
    const sectionTitle = page.locator(".section-title", {
      hasText: "Projects",
    });
    await expect(sectionTitle).toBeVisible({ timeout: 5000 });
  });
});

test.describe("About Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays about section with email link", async ({ page }) => {
    await page.locator('[data-section="about"]').scrollIntoViewIfNeeded();

    const aboutSection = page.locator(".about-section");
    await expect(aboutSection).toBeVisible({ timeout: 5000 });

    // Check that email link exists
    const emailLink = aboutSection.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
  });

  test("about section has bio text", async ({ page }) => {
    await page.locator('[data-section="about"]').scrollIntoViewIfNeeded();

    const aboutText = page.locator(".about-text p").first();
    await expect(aboutText).toBeVisible({ timeout: 5000 });
  });
});
