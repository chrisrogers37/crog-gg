import { test, expect } from "./fixtures";
import { readProjects } from "../src/utils/projectLoader";
import { githubRepo, isServedOwner } from "../src/utils/projectLinks";
import { site } from "./site";

/**
 * Projects Page E2E Tests
 *
 * Philosophy: Test page structure and behavior, not content.
 * Project data ships in the repo (site/public/content/projects/) and is
 * loaded on every route, so it is never optional: a page that renders without
 * it is a failure these tests must report, not an environment condition to
 * skip around (#120 - the skip idiom hid a live production bug).
 */

test.describe("Projects Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    // Page should have a main heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    // Search/filter UI only renders after projects load successfully
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();
  });

  test("displays filter buttons", async ({ page }) => {
    const filterButtons = page.locator(
      ".category-button, .category-filters button",
    );
    await expect(filterButtons.first()).toBeVisible();
  });

  test("search input accepts text", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });
});

test.describe("Projects Page with Data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("project cards link to detail pages", async ({ page }) => {
    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await expect(projectCards.first()).toHaveAttribute(
      "href",
      /\/projects\/.+/,
    );
  });

  test("clicking project card navigates to detail", async ({ page }) => {
    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    // Should navigate to a project detail URL
    await expect(page).toHaveURL(/\/projects\/.+/);
  });
});

test.describe("Projects Filtering Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("filter buttons toggle active state", async ({ page }) => {
    const filterButtons = page.locator(
      ".category-button, .category-filters button",
    );
    // "All" plus at least one real category; a lone button means the
    // category data vanished, which is a failure, not a variant to tolerate
    const secondButton = filterButtons.nth(1);
    await expect(secondButton).toBeVisible();

    await secondButton.click();
    await expect(secondButton).toHaveClass(/\bactive\b/);
  });

  test("search clears properly", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    // Type something
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");

    // Clear it
    await searchInput.fill("");
    await expect(searchInput).toHaveValue("");
  });

  test("no results state shows message or empty grid", async ({ page }) => {
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="earch"]',
    );
    await expect(searchInput).toBeVisible();

    // Search for something that won't match
    await searchInput.fill("xyznonexistent123456789");

    // Zero matches renders the no-results affordance in place of the grid
    const noResults = page.locator(
      '.no-results, [class*="no-results"], [class*="empty"]',
    );
    await expect(noResults.first()).toBeVisible();
    await expect(page.locator("a.project-tile")).toHaveCount(0);
  });
});

test.describe("Project Detail Page", () => {
  test("detail page has back navigation", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectCards = page.locator("a.project-tile");
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Should have some way to go back (breadcrumb, back link, etc.)
    const backNav = page.locator(
      'a[href="/projects"], a[href*="projects"]:not([href*="/projects/"])',
    );
    await expect(backNav.first()).toBeVisible();
  });

  test("non-existent project says so, once the content has loaded", async ({
    page,
  }) => {
    await page.goto("/projects/this-project-does-not-exist-12345");
    // Only a loaded, unknown slug says Not Found (#196 M41).
    await expect(
      page.getByRole("heading", { name: /project not found/i }),
    ).toBeVisible();
  });

  test("deep link to a real project renders its title", async ({
    page,
    request,
  }) => {
    // The first listed project, from the content that ships with the repo.
    const [project] = await readProjects(async (file) =>
      (await request.get(`/content/projects/${file}`)).text(),
    );
    expect(project, "index.yaml lists a project").toBeDefined();

    // Content arrives late, as on a slow network: "Project Not Found" must
    // never show while it loads (#196 M41). Holding the project index holds
    // all of it, since the store sets every field from one Promise.all; a
    // wider glob also caught the dev server's own /src/content/ modules.
    await page.addInitScript(() => {
      const w = window as unknown as { __sawNotFound: boolean };
      w.__sawNotFound = false;
      new MutationObserver(() => {
        if (/project not found/i.test(document.body?.innerText ?? "")) {
          w.__sawNotFound = true;
        }
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await page.route("**/content/projects/index.yaml", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto(`/projects/${project.id}`);
    // The loading skeleton shows while the index is held, which also proves
    // the hold landed.
    await expect(
      page.getByRole("status", { name: "Loading project" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: project.title }),
    ).toBeVisible({ timeout: 10_000 });
    expect(
      await page.evaluate(
        () => (window as unknown as { __sawNotFound: boolean }).__sawNotFound,
      ),
    ).toBe(false);
  });
});

test.describe("A deep-linked project page while /api/features answers (#189 M21)", () => {
  test("doesn't shift when the answer lands", async ({ page, request }) => {
    const projects = await readProjects(async (file) =>
      (await request.get(`/content/projects/${file}`)).text(),
    );
    const linked = projects.find((project) => {
      const repo = githubRepo(project);
      return repo && isServedOwner(site, repo.owner);
    });
    test.skip(!linked, "no project links a repo the API serves");
    test.skip(site.features?.github === "off", "site.yaml turns the GitHub panels off");

    // The answer takes two seconds, and GitHub never answers, so the panels'
    // skeletons stay put and only the answer could move anything.
    let answered = false;
    await page.route("**/api/features", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      answered = true;
      await route.fulfill({ json: { regenerate: true, github: true } });
    });
    await page.route("**/api/v1/github/**", () => new Promise(() => {}));
    await page.goto(`/projects/${linked!.id}`);
    await expect(page.locator(".project-footer")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(answered, "the answer was still on its way when sampling began").toBe(false);

    const tops = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const seen: number[] = [];
          const start = performance.now();
          const sample = () => {
            seen.push(document.querySelector<HTMLElement>(".project-footer")!.offsetTop);
            if (performance.now() - start < 2500) requestAnimationFrame(sample);
            else resolve(seen);
          };
          requestAnimationFrame(sample);
        }),
    );
    expect(new Set(tops).size, `the footer's offsets: ${[...new Set(tops)].join(", ")}`).toBe(1);
  });
});
