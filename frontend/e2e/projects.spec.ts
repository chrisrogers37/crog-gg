import { test, expect } from "./fixtures";
import { hasOwnPage } from "../src/content/ownPages";
import { githubRepo, isServedOwner } from "../src/utils/projectLinks";
import type { ReadmeResponse, Repository } from "../src/services/githubService";
import { FEATURED, servedProjects, site } from "./site";

/**
 * Projects Page E2E Tests
 *
 * Philosophy: Test page structure and behavior, not content.
 * Project data ships in the repo (site/public/content/projects/) and is
 * loaded on every route, so it is never optional: a page that renders without
 * it is a failure these tests must report, not an environment condition to
 * skip around (#120 - the skip idiom hid a live production bug).
 */

test.describe("Projects page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
  });

  test("displays page header", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows the featured project first, larger, with a way to its page", async ({ page }) => {
    test.skip(!FEATURED, "index.yaml features no project");
    const featured = page.locator("article.project-featured");
    await expect(featured).toBeVisible();
    await expect(featured.locator(`a[href="/projects/${FEATURED}"]`)).toBeVisible();
    // Above every other project.
    const featuredBox = await featured.boundingBox();
    const firstRow = await page.locator("a.project-row-link").first().boundingBox();
    expect(featuredBox!.y).toBeLessThan(firstRow!.y);
  });

  test("project rows link to detail pages", async ({ page }) => {
    const projectRows = page.locator("a.project-row-link");
    await expect(projectRows.first()).toBeVisible();
    await expect(projectRows.first()).toHaveAttribute("href", /\/projects\/.+/);
  });

  test("clicking a project's name navigates to detail", async ({ page }) => {
    const projectRows = page.locator("a.project-row-link");
    await expect(projectRows.first()).toBeVisible();
    await projectRows.first().click();
    await expect(page).toHaveURL(/\/projects\/.+/);
  });

  test("the featured card stands out in the site's accent, in both themes", async ({ page }) => {
    test.skip(!FEATURED, "index.yaml features no project");
    const featured = page.locator("article.project-featured");
    const label = featured.locator(".page-eyebrow");
    const card = page.locator(".projects-page .project-row").first();
    const style = (locator: import("@playwright/test").Locator, property: string) =>
      locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
    // Light, then dark: .card's dark-theme rule once kept the border grey.
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") {
        await page.getByRole("button", { name: /current theme/i }).first().click();
      }
      // A heavier border than the other cards', in the colour of its label,
      // which is the accent.
      await expect.poll(() => style(featured, "border-top-color"), theme).toBe(
        await style(label, "color"),
      );
      expect(await style(featured, "border-top-width"), theme).toBe("2px");
      expect(await style(card, "border-top-width"), theme).toBe("1px");
      expect(await style(card, "border-top-color"), theme).not.toBe(await style(label, "color"));
    }
  });

  test("a row opens its project wherever it's clicked, its description included", async ({
    page,
  }) => {
    // The name's link stretches over its row (Projects.css), so the click
    // goes to wherever the description is, and the browser decides what takes
    // it: locator.click() would refuse, seeing the link on top, which is the
    // point.
    const row = page.locator(".projects-page .project-row").first();
    const href = await row.locator("a.project-row-link").getAttribute("href");
    await row.scrollIntoViewIfNeeded();
    const description = (await row.locator(".project-row-description").boundingBox())!;
    await page.mouse.click(
      description.x + description.width / 2,
      description.y + description.height / 2,
    );
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("lists every project once: the featured one, and a row for each other", async ({
    page,
    request,
  }) => {
    const projects = await servedProjects(request);
    await expect(page.locator("a.project-row-link").first()).toBeVisible();
    const cards = await page.locator("a.project-row-link").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(cards).toEqual(
      projects.filter((project) => !project.featured).map((project) => `/projects/${project.id}`),
    );
  });
});

test.describe("Project Detail Page", () => {
  test("detail page has back navigation", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectCards = page.locator("a.project-row-link");
    await expect(projectCards.first()).toBeVisible();
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/projects\/.+/);

    // Some way back on the page itself (breadcrumbs, a back link), not the
    // header's own link.
    await expect(page.locator('main a[href="/projects"]').first()).toBeVisible();
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
    const [project] = await servedProjects(request);
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
    // Its own head names it, whatever its page's headline says (a project
    // with a page of its own heads it with its own line).
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveTitle(new RegExp(`^${project.title} \\|`));
    expect(
      await page.evaluate(
        () => (window as unknown as { __sawNotFound: boolean }).__sawNotFound,
      ),
    ).toBe(false);
  });
});

/**
 * The first project on the standard page that links a repo the API serves,
 * or none. A page of its own (Claudlobby's) has no GitHub panels.
 */
const linkedProject = async (request: import("@playwright/test").APIRequestContext) =>
  (await servedProjects(request)).find((project) => {
    const repo = githubRepo(project);
    return repo && isServedOwner(site, repo.owner) && !hasOwnPage(project.id);
  });

/** GitHub's answer for a README, as the API passes it through. */
const readmeAnswer = (text: string): ReadmeResponse => ({
  content: Buffer.from(text).toString("base64"),
  encoding: "base64",
  sha: "0",
  html_url: "https://github.com/someone/example/blob/main/README.md",
  download_url: "https://raw.githubusercontent.com/someone/example/main/README.md",
});

/** A README with everything that can't wrap: a wide table, a long URL, long code. */
const WIDE_README = [
  "# A README",
  "",
  `| ${Array.from({ length: 10 }, (_, i) => `column ${i}`).join(" | ")} |`,
  `|${" --- |".repeat(10)}`,
  `| ${Array.from({ length: 10 }, (_, i) => `value ${i}`).join(" | ")} |`,
  "",
  `See https://example.com/${"averylongpathsegment".repeat(10)} for more.`,
  "",
  "```",
  `const x = ${"call(".repeat(20)}${")".repeat(20)};`,
  "```",
].join("\n");

test.describe("A deep-linked project page while /api/features answers (#189 M21)", () => {
  test("doesn't shift when the answer lands", async ({ page, request }) => {
    const linked = await linkedProject(request);
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

test.describe("A project page on a phone (final UI review)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("keeps a wide README on the screen, and the stats where they loaded", async ({
    page,
    request,
  }) => {
    const linked = await linkedProject(request);
    test.skip(!linked, "no project links a repo the API serves");
    test.skip(site.features?.github === "off", "site.yaml turns the GitHub panels off");

    let answerRepo!: () => void;
    const repoAsked = new Promise<void>((resolve) => (answerRepo = resolve));
    await page.route("**/api/v1/github/repo/**", async (route) => {
      await repoAsked;
      await route.fulfill({
        json: {
          stargazers_count: 12,
          forks_count: 3,
          watchers_count: 12,
          open_issues_count: 1,
          language: "Python",
          license: { name: "MIT License", spdx_id: "MIT" },
          pushed_at: "2026-09-30T12:00:00Z",
          topics: [],
        } satisfies Partial<Repository>,
      });
    });
    await page.route("**/api/v1/github/readme/**", (route) =>
      route.fulfill({ json: readmeAnswer(WIDE_README) }),
    );
    await page.goto(`/projects/${linked!.id}`);

    // The stats take the room they'll fill before they arrive, so nothing
    // below them moves when they do.
    const loading = page.getByRole("status", { name: /loading repository stats/i });
    await expect(loading).toBeVisible();
    const before = (await loading.boundingBox())!.height;
    answerRepo();
    await expect(loading).toBeHidden();
    const after = (await page.locator(".repo-stats").boundingBox())!.height;
    expect(Math.abs(after - before), `${before}px loading, ${after}px loaded`).toBeLessThanOrEqual(1);

    // The README stays on the screen, and hides none of itself past its own
    // edge: the table scrolls in a box of its own, and the URL wraps. (The
    // layout clips sideways overflow, so the page's scroll width can't tell.)
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    const card = (await page.getByRole("article").boundingBox())!;
    expect(card.x + card.width).toBeLessThanOrEqual(375);
    expect(
      await table.evaluate((el) => {
        const box = el.parentElement!;
        return getComputedStyle(box).overflowX === "auto" && box.scrollWidth > box.clientWidth;
      }),
    ).toBe(true);
    const url = (await page.getByRole("link", { name: /example\.com/ }).boundingBox())!;
    expect(url.x + url.width).toBeLessThanOrEqual(card.x + card.width);
  });
});

test.describe("/projects while the projects load (final UI review)", () => {
  test("the rows stay where the skeleton stood", async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/content/projects/index.yaml", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/projects");

    const skeleton = page.getByRole("status", { name: /loading projects/i });
    await expect(skeleton).toBeVisible();
    const box = async (locator: import("@playwright/test").Locator) =>
      (await locator.boundingBox())!;
    const featuredStandIn = await box(skeleton.locator(".project-featured"));
    const rowStandIn = await box(skeleton.locator(".project-rows > *").first());
    release();
    await expect(page.locator(".projects-page a.project-row-link").first()).toBeVisible();

    // The featured card lands where its stand-in stood, at its width; the
    // page's width doesn't follow its content.
    if (FEATURED) {
      const featured = await box(page.locator(".projects-page article.project-featured"));
      expect(featured.y).toBeCloseTo(featuredStandIn.y, 0);
      expect(featured.x).toBeCloseTo(featuredStandIn.x, 0);
      expect(featured.width).toBeCloseTo(featuredStandIn.width, 0);
    }
    // And the rows in their stand-ins' column, at their width. (Not their
    // top: the featured card's description wraps to as many lines as the fonts
    // make it, which the skeleton can't know.)
    const row = await box(page.locator(".projects-page .project-rows > .project-row").first());
    expect(row.x).toBeCloseTo(rowStandIn.x, 0);
    expect(row.width).toBeCloseTo(rowStandIn.width, 0);
  });
});

test.describe("A project page while the projects load", () => {
  test("its hero lands where its stand-in stood, in the stand-in's colours", async ({
    page,
    request,
  }) => {
    // The first project: on this site Claudlobby, on the example a standard page.
    const [project] = await servedProjects(request);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/content/projects/index.yaml", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto(`/projects/${project.id}`);

    const standIn = page.getByRole("status", { name: "Loading project" }).locator(".page-hero");
    await expect(standIn).toBeVisible();
    const before = (await standIn.boundingBox())!;
    const background = await standIn.evaluate((el) => getComputedStyle(el).backgroundColor);
    release();

    const hero = page.locator(".page-hero").filter({ has: page.locator("h1") });
    await expect(hero).toBeVisible();
    const after = (await hero.boundingBox())!;
    for (const key of ["x", "y", "width"] as const) {
      expect(after[key], key).toBeCloseTo(before[key], 0);
    }
    await expect(hero).toHaveCSS("background-color", background);
  });

  test("a standard project's hero sits close under its breadcrumbs", async ({
    page,
    request,
  }) => {
    const project = (await servedProjects(request)).find(({ id }) => !hasOwnPage(id));
    expect(project, "index.yaml lists a project on the standard page").toBeDefined();
    await page.goto(`/projects/${project!.id}`);
    await expect(page.locator(".page-hero h1")).toBeVisible();
    await expect(page.locator(".page-hero")).toHaveCSS("padding-top", "0px");
  });
});

test.describe("Projects that won't load (#190 M23)", () => {
  test("the page says which file, and offers a retry", async ({ page }) => {
    await page.route("**/content/projects/index.yaml", (route) => route.fulfill({ status: 500 }));
    await page.goto("/projects");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("content/projects/index.yaml");
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});
