import { test, expect } from "./fixtures";
import { claudfather as content } from "../src/content/claudfather";
import { claudfather as palette } from "../src/styles/palette";
import { CLAUDLOBBY_GETTING_STARTED } from "../src/content/links";
import { CLAUDFATHER, cardOf, expectBelowHeader, site } from "./site";

const PAGE = "/projects/claudfather";
test.skip(!CLAUDFATHER, "the site doesn't list Claudfather");
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(", ")})`;

for (const width of [375, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`page, controls and anchors work at ${width}px in ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem(
          "ui-storage",
          JSON.stringify({ state: { theme: selectedTheme }, version: 0 }),
        );
      }, theme);
      await page.goto(PAGE);
      if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
      else await expect(page.locator("html")).not.toHaveClass(/dark/);
      const hero = page.locator(".page-hero");
      await expect(hero.locator("h1")).toBeVisible();
      await expect(hero).toHaveCSS("background-color", rgb(palette.charcoal));
      await expect(page.locator("#claudlobby a")).toHaveCSS(
        "color", rgb(theme === "dark" ? palette.orange : palette.orangeDeep),
      );
      await expect(hero.locator(".badge")).toBeInViewport({ ratio: 1 });
      if (content.website) {
        await expect(
          hero.locator(`a[href="${content.website.url}"]`),
        ).toBeInViewport({ ratio: 1 });
        await expect(hero.getByText(content.website.caveat)).toBeVisible();
      }
      const mark = hero.locator("img");
      await expect
        .poll(() =>
          mark.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      // Every actionable control within the specialized page has a usable height.
      for (const link of await page.locator(".cl-page a").all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      const walkthrough = hero.locator('a[href="#how-it-works"]');
      await walkthrough.focus();
      await expect(walkthrough).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#how-it-works$/);
      await expectBelowHeader(page, "#how-it-works h2");
      await expect(page.locator("#how-it-works ol > li")).toHaveCount(3);
      await expect(page.locator("#family .cf-family-row")).toHaveCount(4);
      await expect(page.locator("#claudosseum a")).toHaveCount(0);
      await expect(
        page.locator(".stats-grid, .cl-counts, #readme"),
      ).toHaveCount(0);
      await expect(
        page.locator(`#quickstart a[href="${CLAUDLOBBY_GETTING_STARTED}"]`),
      ).toBeVisible();
    });
  }
}

for (const anchor of ["quickstart", "updates", "roadmap", "claudlobby"]) {
  test(`old shared link retains query and #${anchor}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/projects/claudlobby?utm_source=old&ref=shared#${anchor}`);
    await expect(page).toHaveURL(
      `${page.url().split("/projects/")[0]}${PAGE}?utm_source=old&ref=shared#${anchor}`,
    );
    await expect(page.locator(`#${anchor}`)).toBeInViewport();
  });
}

test("the featured card opens the ecosystem and updates its share image", async ({
  page,
}) => {
  await page.goto("/projects");
  const featured = page.locator("article.project-featured");
  await expect(featured.locator('a[href^="https://github.com"]')).toHaveCount(
    0,
  );
  await featured.locator(`a[href="${PAGE}"]`).click();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${site.site.url}${cardOf(PAGE).path}`,
  );
  const trail = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(trail.getByRole("link", { name: "projects" })).toHaveAttribute(
    "href",
    "/projects",
  );
});
