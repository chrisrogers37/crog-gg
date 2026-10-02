import { test, expect } from "@playwright/test";
import { ABOUT, OTHER_TABS, TABS_PATH, named, withLongAbout } from "./site";

/**
 * Navigation E2E Tests
 *
 * Philosophy: Test navigation behavior and page structure.
 * Don't depend on specific content or data loading.
 */

test.describe("Site Navigation", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");
    // Page should have loaded without error
    await expect(page.locator("body")).toBeVisible();
    // Should have main content area
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("projects page is accessible", async ({ page }) => {
    await page.goto("/projects");
    // Should have a heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can navigate between pages using links", async ({ page }) => {
    // Start on projects page (has navigation header)
    await page.goto("/projects");

    // The nav logo is repo-shipped structure, not optional data, so it is
    // required. Guarding this on a one-shot isVisible() meant the test passed
    // having asserted nothing whenever the link failed to render.
    const homeLink = page
      .locator('a[href="/"], .nav-logo, [class*="logo"]')
      .first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("404 Page", () => {
  test("displays 404 for non-existent routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-xyz");

    // Should show some indication this page doesn't exist
    const notFoundIndicators = page.locator(
      '.not-found, [class*="not-found"], [class*="404"], h1:has-text("404")',
    );
    await expect(notFoundIndicators.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("A page that fails to load", () => {
  test("reloads once, then shows an error with the page's head intact", async ({
    page,
  }) => {
    // What a tab opened before a deploy meets: the page's chunk is gone.
    await page.route("**/src/pages/Projects/ProjectsPage.tsx*", (route) =>
      route.abort(),
    );
    let documentLoads = 0;
    page.on("request", (request) => {
      if (request.resourceType() === "document") documentLoads += 1;
    });

    await page.goto("/projects");

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator('[class*="not-found"]')).toHaveCount(0);
    expect(documentLoads).toBe(2);

    // Not the 404 page's head: still indexable, still its own canonical.
    const head = await page.evaluate(() => ({
      robots: document.querySelector('meta[name="robots"]'),
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href"),
    }));
    expect(head.robots).toBeNull();
    expect(new URL(head.canonical ?? "", "https://x").pathname).toBe(
      "/projects",
    );
  });
});

test.describe("Moving between pages", () => {
  test("a new page opens at the top, not where the last one was scrolled", async ({
    page,
  }) => {
    // /projects first, so it renders at once later, as it does for anyone
    // who's been there.
    await page.goto("/projects");
    await expect(page.locator("a.project-tile").first()).toBeVisible();
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.locator('header a[href="/projects"]').first().click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator("a.project-tile").first()).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("Layout Components", () => {
  test("header is present on projects page", async ({ page }) => {
    await page.goto("/projects");
    // Projects page should have header/nav
    const header = page.locator("header, nav, .navigation");
    await expect(header.first()).toBeVisible();
  });

  test("main content area exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();

    await page.goto("/projects");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("External Links", () => {
  test("social links open in new tab", async ({ page }) => {
    await page.goto("/");

    // Home ships external links (with home: landing, the Claudlobby repo in
    // the header, hero and footer; with home: profile, the owner's socials),
    // so a count-gate here would be inconsistent with the suite.
    // Worse, this is a security assertion: under the gate, removing every
    // target="_blank" made the rel="noopener" check silently stop running
    // instead of failing, which is the one outcome it exists to prevent.
    const externalLinks = page.locator('a[target="_blank"]');
    await expect(externalLinks.first()).toBeVisible();

    const rel = await externalLinks.first().getAttribute("rel");
    expect(rel).toContain("noopener");
  });
});

test.describe("Mobile Menu", () => {
  test("mobile menu opens and closes", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Find and click hamburger
    const hamburger = page.locator(".nav-hamburger");
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Menu should be visible
    const menu = page.locator(".mobile-menu");
    await expect(menu).toBeVisible({ timeout: 3000 });

    // Close button should work
    const closeBtn = page.locator(".mobile-menu-close");
    await closeBtn.click();
    await expect(menu).not.toBeVisible();
  });

  test("mobile menu section navigation works", async ({ page }) => {
    // A tab that isn't About, which is selected on load.
    const [second] = OTHER_TABS;
    test.skip(!second, "needs a tab other than About");
    await page.setViewportSize({ width: 375, height: 812 });
    // The section links live on the personal page's menu.
    await page.goto(TABS_PATH);

    // Open menu
    await page.locator(".nav-hamburger").click();

    // Click a section (the menu prints its label in lowercase)
    const journeyBtn = page.locator(".mobile-menu-section-btn", {
      hasText: named(second.label),
    });
    await journeyBtn.click();

    // Menu should close
    await expect(page.locator(".mobile-menu")).not.toBeVisible();

    // The section's panel should be visible
    await expect(page.getByRole("tabpanel", { name: named(second.label) })).toBeVisible({
      timeout: 5000,
    });

    // Reopened, the menu marks the section the page now has open.
    await page.locator(".nav-hamburger").click();
    await expect(journeyBtn).toHaveClass(/active/);
    await expect(
      page.locator(".mobile-menu-section-btn", { hasText: named(ABOUT.label) }),
    ).not.toHaveClass(/active/);

    // Choosing the open section again keeps it open: only a tab click
    // closes a section. (Read from the menu's marking, which follows the
    // page's state, not from an animation still running.)
    await journeyBtn.click();
    await expect(page.locator(".mobile-menu")).not.toBeVisible();
    await page.locator(".nav-hamburger").click();
    await expect(journeyBtn).toHaveClass(/active/);
  });

  test("leaving the personal page takes its sections out of the menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(TABS_PATH);
    await page.locator(".nav-hamburger").click();
    await expect(page.locator(".mobile-menu-section-btn").first()).toBeVisible();

    // To /projects, which every site has, whatever its home.
    await page.locator(".mobile-menu-link", { hasText: "all projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await page.locator(".nav-hamburger").click();
    await expect(page.locator(".mobile-menu")).toBeVisible();
    await expect(page.locator(".mobile-menu-section-btn")).toHaveCount(0);
  });

  test("the header's logo stays on one line on a small phone", async ({
    page,
  }) => {
    // Every site's: the logo is the owner's name, from site.yaml.
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    const logo = await page.locator("header .nav-logo").boundingBox();
    expect(logo!.height).toBeLessThan(45);
  });

  test("hamburger hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const hamburger = page.locator(".nav-hamburger");
    await expect(hamburger).not.toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still render main elements
    await expect(
      page.locator('h1, .profile-name, [class*="name"]').first(),
    ).toBeVisible();
  });

  test("page renders on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(
      page.locator('h1, .profile-name, [class*="name"]').first(),
    ).toBeVisible();
  });

  test("projects page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects");

    // Should show heading
    await expect(page.locator("h1")).toBeVisible();

    // Projects ship with the repo, so the search input is required rather than
    // conditional. The old gate asserted visibility only after establishing it,
    // which could not fail either way: absent, it skipped the assertion;
    // present, it re-checked what the guard had just read.
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Page Load Performance", () => {
  test("home page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");

    // Wait for main content
    await expect(page.locator("h1").first()).toBeVisible();

    const loadTime = Date.now() - startTime;
    // Page should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });

  test("projects page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/projects");

    await expect(page.locator("h1")).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe("see more survives a collapse (#165)", () => {
  test("expand, collapse, expand again", async ({ page }) => {
    await withLongAbout(page);
    await page.goto(TABS_PATH);

    // First expansion. This is the POSITIVE CONTROL: without it the test
    // would also pass on a page where "see more" never worked at all.
    await page.waitForSelector(".section-fade-btn", { timeout: 15000 });
    await page.click(".section-fade-btn");
    await expect(page.locator(".generate-btn")).toBeVisible({ timeout: 10000 });

    // Collapse the way a reader does -- clicking the tab that is already
    // open. SectionNav reports the clicked id, and AboutPage turns a click on
    // the open tab back into About's preview.
    await page.locator(".section-nav-button.active").first().click();
    await expect(page.locator(".section-fade-btn")).toBeVisible({
      timeout: 10000,
    });

    // The regression: from here "see more" still rendered and still took
    // clicks, but changed nothing, and SUMMON NEW LORE was gone with it. So
    // both halves are asserted -- the control has to work AND has to put the
    // reader back somewhere that has the primary action on it.
    await page.click(".section-fade-btn");
    await expect(page.locator(".generate-btn")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".section-content")).toBeVisible();
  });
});

test.describe("With site data blocked (#196 M70)", () => {
  // A browser that blocks site data throws on any localStorage access; Firefox
  // with storage turned off returns null instead.
  for (const blocked of ["throws", "is null"] as const) {
  test(`the pages still render, and the theme still switches (localStorage ${blocked})`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      Object.defineProperty(window, "localStorage", {
        get() {
          if (mode === "is null") return null;
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      });
    }, blocked);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();

    // The toggle still cycles the theme, kept in memory for the visit.
    const toggle = page.getByRole("button", { name: /current theme/i }).first();
    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    await toggle.click();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains("dark")),
      )
      .not.toBe(before);

    await page.goto(TABS_PATH);
    await expect(page.locator(".about-page h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
  }
});

test.describe("The system theme (#196 M70)", () => {
  test("follows an OS theme switch while the page is open", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    // Light, then dark, then system.
    const toggle = page.getByRole("button", { name: /current theme/i }).first();
    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-label", /system preference/i);

    const isDark = () =>
      page.evaluate(() => document.documentElement.classList.contains("dark"));
    await expect.poll(isDark).toBe(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(isDark).toBe(true);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(isDark).toBe(false);
  });
});
