import type { Locator, Page } from "@playwright/test";
import type { ReadmeResponse } from "../src/services/githubService";
import { test, expect } from "./fixtures";
import { servedProjects, site } from "./site";

/**
 * Link hover E2E Tests: what a pointer over a link does to its decoration.
 *
 * Philosophy: structure and behaviour, found by the classes the code owns,
 * never by the site's copy. App.css sets a link's decoration with zero
 * specificity, so a link family's own rule decides it: the logo, the nav and
 * menu links, the breadcrumbs, the project rows and the footer's links keep no
 * underline under a pointer, and a link with no rule of its own, such as one
 * in a README, gets one. That README link is the control: it shows the hover
 * rule is live, so the "none" of the others isn't a rule that never applied.
 *
 * Chromium only: Desktop Chrome has a pointer that hovers, and the webkit
 * project's testMatch (playwright.config.ts) doesn't list this file. The menu
 * is opened at a phone's width in that same project, so the pointer still
 * hovers.
 */

type Theme = "light" | "dark";

/** A phone's size, where the menu stands in for the header's links. */
const PHONE = { width: 390, height: 844 };

/** A README with a link in its running text. */
const README = "See [the docs](https://example.com/docs).";

/** GitHub's answer for a README, as the API passes it through. */
const readmeAnswer = (text: string): ReadmeResponse => ({
  content: Buffer.from(text).toString("base64"),
  encoding: "base64",
  sha: "0",
  html_url: "https://github.com/someone/example/blob/main/README.md",
  download_url: "https://raw.githubusercontent.com/someone/example/main/README.md",
});

const FIXTURE = "hover-fixture";

/**
 * Routes a standard project page with a README: a repo the API serves (the
 * site's own GitHub owner, so either site serves it) and its README.
 */
async function routeReadmeProject(page: Page) {
  await page.route("**/content/projects/index.yaml", (route) =>
    route.fulfill({ json: { projects: [`${FIXTURE}.yaml`] } }),
  );
  await page.route(`**/content/projects/${FIXTURE}.yaml`, (route) =>
    route.fulfill({
      json: {
        id: FIXTURE,
        title: "Hover fixture",
        description: "A fixture.",
        icon: "🔗",
        category: "web-app",
        url: `https://github.com/${site.github.username}/${FIXTURE}`,
      },
    }),
  );
  await page.route("**/api/v1/github/repo/**", (route) =>
    route.fulfill({ status: 503, json: { error: "not needed for README checks" } }),
  );
  await page.route("**/api/v1/github/readme/**", (route) =>
    route.fulfill({ json: readmeAnswer(README) }),
  );
}

/**
 * `path` in `theme`, with motion reduced so the menu sits where it ends up at
 * once. The theme is set before the app loads, and confirmed once it has.
 */
async function open(page: Page, theme: Theme, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem(
      "ui-storage",
      JSON.stringify({ state: { theme: selectedTheme }, version: 0 }),
    );
  }, theme);
  await page.goto(path);
  if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
  else await expect(page.locator("html")).not.toHaveClass(/dark/);
  // The premise: this context can hover, which is what the hover rule is gated on.
  expect(
    await page.evaluate(() => matchMedia("(hover: hover)").matches),
    "a pointer that hovers",
  ).toBe(true);
}

/** How `link` is decorated now: the computed `text-decoration-line`. */
const decorationOf = (link: Locator) =>
  link.evaluate((el) => getComputedStyle(el).textDecorationLine);

/**
 * That `link`, with the pointer over it, has `line` as its decoration. The
 * pointer is polled first: one that never landed on the link would let "none"
 * pass for any link.
 */
async function expectHover(link: Locator, name: string, line: "none" | "underline") {
  await link.hover();
  await expect
    .poll(() => link.evaluate((el) => el.matches(":hover")), {
      message: `${name}: the pointer is over it`,
    })
    .toBe(true);
  await expect
    .poll(() => decorationOf(link), { message: `${name}: its decoration on hover` })
    .toBe(line);
}

for (const theme of ["light", "dark"] as const) {
  test(`the logo, a nav link and a footer link keep no underline on hover, in ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, "/");
    // The page's sections load after it does and push the footer down.
    await page.waitForLoadState("networkidle");

    await expectHover(page.locator("header .nav-logo"), "the logo", "none");
    await expectHover(page.locator("header .nav-link").first(), "a nav link", "none");
    await expectHover(page.locator(".footer-links a").first(), "a footer link", "none");
  });

  test(`a project row keeps no underline on hover, in ${theme}`, async ({ page }) => {
    await open(page, theme, "/projects");
    await page.waitForLoadState("networkidle");

    await expectHover(page.locator("a.project-row-link").first(), "a project row", "none");
  });

  test(`a breadcrumb keeps no underline on hover, in ${theme}`, async ({ page, request }) => {
    // Every project page has the trail, one with a page of its own included.
    const [project] = await servedProjects(request);
    expect(project, "index.yaml lists a project").toBeDefined();
    await open(page, theme, `/projects/${project.id}`);

    const trail = page.getByRole("navigation", { name: "Breadcrumb" });
    await expectHover(trail.locator(".breadcrumb-link").first(), "a breadcrumb", "none");
  });

  test(`a menu link keeps no underline on hover at ${PHONE.width}px, in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await open(page, theme, "/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(menu).toBeVisible();
    await expectHover(menu.locator(".mobile-menu-link").first(), "a menu link", "none");
  });

  test(`a link in a README underlines on hover, in ${theme}`, async ({ page }) => {
    test.skip(site.features?.github === "off", "site.yaml turns the GitHub panels off");
    await routeReadmeProject(page);
    await open(page, theme, `/projects/${FIXTURE}`);

    // The README arrives after the page does.
    const link = page.locator("#readme").getByRole("link", { name: "the docs" });
    await expect(link).toBeVisible({ timeout: 15_000 });
    // Plain until the pointer is over it: the hover is what underlines it.
    expect(await decorationOf(link), "a link in a README at rest").toBe("none");
    await expectHover(link, "a link in a README", "underline");
  });
}
