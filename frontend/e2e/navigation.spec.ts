import { test, expect } from "./fixtures";
import { SECTIONS } from "./site";

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
    await expect(page.locator("a.project-card").first()).toBeVisible();
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.locator('header a[href="/projects"]').first().click();
    await expect(page).toHaveURL(/\/projects$/);
    // /projects' own cards: the home page has cards too, and stays up for a
    // moment after the URL changes.
    await expect(page.locator(".projects-page a.project-card").first()).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("it opens at the top even while an in-page link's scroll is still moving", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#contact")).toBeAttached();
    // Connect scrolls smoothly down the long page; Projects is clicked before
    // it lands. An instant jump to the top didn't stop that scroll, which
    // carried on down the new page.
    await page.locator('.page-hero a[href="#contact"]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.locator('header a.nav-link[href="/projects"]').click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator(".projects-page a.project-card").first()).toBeVisible();
    // Observation window: past where the old page's scroll would have ended.
    await page.waitForTimeout(1200);
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

    // Home ships external links (the owner's socials, in its contact section
    // and the footer), so a count-gate here would be inconsistent with the
    // suite.
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

  test("mobile menu jumps to a section of the home page", async ({ page }) => {
    const last = SECTIONS[SECTIONS.length - 1];
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(`#${last.id} h2`)).toBeAttached();

    // The menu links each section by its id.
    await page.locator(".nav-hamburger").click();
    await page.locator(`.mobile-menu a[href="#${last.id}"]`).click();

    // The menu closes, and the page is at the section.
    await expect(page.locator(".mobile-menu")).not.toBeVisible();
    await expect(page.locator(`#${last.id} h2`)).toBeInViewport();
  });

  test("leaving the home page takes its sections out of the menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.locator(".nav-hamburger").click();
    await expect(page.locator('.mobile-menu a[href^="#"]').first()).toBeVisible();

    // To /projects, which every site has: the page, not the section.
    await page.locator('.mobile-menu a[href="/projects"]').click();
    await expect(page).toHaveURL(/\/projects$/);
    await page.locator(".nav-hamburger").click();
    await expect(page.locator(".mobile-menu")).toBeVisible();
    await expect(page.locator('.mobile-menu a[href^="#"]')).toHaveCount(0);
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

    // Projects ship with the repo, so a card is required rather than
    // conditional, and the page stays inside the phone's width.
    await expect(page.locator("a.project-card").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375);
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

    await page.goto("/projects");
    await expect(page.locator(".page-hero h1")).toBeVisible();
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
