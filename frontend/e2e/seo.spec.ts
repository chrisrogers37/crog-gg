import { test, expect, type Page } from "@playwright/test";

/**
 * Page head E2E tests (#174)
 *
 * Every page's HTML arrives with head tags already in it (the build writes
 * them per route; the dev server writes the home page's), and the SEO
 * component renders its own once React mounts. The two sets must merge into
 * one: a second og:title or canonical is a page that tells crawlers two
 * different things. These check structure (how many, and which URL they
 * name), not copy.
 */

const headTags = (page: Page) =>
  page.evaluate(() => ({
    ogTitle: document.querySelectorAll('meta[property="og:title"]').length,
    description: document.querySelectorAll('meta[name="description"]').length,
    twitterCard: document.querySelectorAll('meta[name="twitter:card"]').length,
    canonical: Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
    ).map((link) => new URL(link.href).pathname),
    ogImage: document
      .querySelector<HTMLMetaElement>('meta[property="og:image"]')
      ?.getAttribute("content"),
  }));

test.describe("Page head", () => {
  test("home page carries one set of tags, canonical to the root", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();

    const tags = await headTags(page);
    expect(tags.ogTitle).toBe(1);
    expect(tags.description).toBe(1);
    expect(tags.twitterCard).toBe(1);
    expect(tags.canonical).toEqual(["/"]);
    // Crawlers resolve nothing, so the preview image has to be absolute.
    expect(tags.ogImage).toMatch(/^https:\/\/.+\.png$/);
  });

  test("projects page replaces the entry tags with its own", async ({
    page,
  }) => {
    await page.goto("/projects");
    await expect(page.locator("a.project-tile").first()).toBeVisible();

    await expect
      .poll(async () => (await headTags(page)).canonical)
      .toEqual(["/projects"]);
    const tags = await headTags(page);
    expect(tags.ogTitle).toBe(1);
    expect(tags.description).toBe(1);
  });

  test("a project page's canonical names that project", async ({ page }) => {
    await page.goto("/projects");
    const firstCard = page.locator("a.project-tile").first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/.+/);
    const path = new URL(page.url()).pathname;

    await expect
      .poll(async () => (await headTags(page)).canonical)
      .toEqual([path]);
    expect((await headTags(page)).ogTitle).toBe(1);
  });
});
