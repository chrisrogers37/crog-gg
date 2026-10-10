import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { CLAUDLOBBY_REPO as REPO } from "../src/content/links";
import { CLAUDFATHER, FEATURED } from "./site";

/**
 * Analytics in the production build (#177). Vercel serves the real script
 * once Web Analytics is enabled on the project; `vite preview` answers with
 * an empty one (vite.config.ts), so events stay in the queue
 * @vercel/analytics keeps for it: exactly what the page hands the real script.
 * Links are found by where they go, not by their copy.
 */

/** The events the page has queued for the analytics script. */
const queuedEvents = (page: Page) =>
  page.evaluate(() => (window.vaq ?? []).filter(([type]) => type === "event"));

test.beforeEach(async ({ context }) => {
  // The repo links open GitHub in a new tab; keep the test offline.
  await context.route("https://github.com/**", (route) => route.abort());
});

test("loads the analytics script from the site's own origin", async ({
  page,
}) => {
  const script = page.waitForRequest("**/_vercel/insights/script.js");
  await page.goto("/");
  expect(new URL((await script).url()).origin).toBe(
    new URL(page.url()).origin,
  );

  // The filter the real script is handed keeps utm_* tags and drops every
  // other query parameter and the fragment.
  const reported = await page.evaluate(() => {
    const filter = (window.vaq ?? []).find(([type]) => type === "beforeSend")?.[1] as
      | ((event: { type: "pageview"; url: string }) => { url: string })
      | undefined;
    return filter?.({
      type: "pageview",
      url: `${location.origin}/?email=a&utm_source=x#token=1`,
    }).url;
  });
  expect(reported).toBe(`${new URL(page.url()).origin}/?utm_source=x`);
});

test("keeps repo clicks specific and never counts product exploration as activation", async ({ page, context }) => {
  test.skip(!CLAUDFATHER, "the site doesn't list the ecosystem page");
  await context.route("https://claudfather-ai.vercel.app/**", (route) => route.abort());
  await page.goto("/projects/claudfather");
  await page.locator('.page-hero a[href="#how-it-works"]').click();
  await page.locator('.page-hero a[href="https://github.com/Claudfather"]').click();
  await page.locator('.page-hero .cf-website a').click();
  expect(await queuedEvents(page)).toEqual([]);
  await page.locator(`#claudlobby a[href="${REPO}"]`).click();
  await page.locator(`#updates a[href="${REPO}/releases"]`).click();
  expect(await queuedEvents(page)).toEqual([
    ["event", { name: "repo_click", data: { location: "family" } }],
    ["event", { name: "updates_click", data: {} }],
  ]);
  expect(await page.context().cookies()).toEqual([]);
});

test("the featured ecosystem leads internally without a repository conversion", async ({ page }) => {
  test.skip(FEATURED !== "claudfather", "the site doesn't feature Claudfather");
  await page.goto("/projects");
  await page.locator('article.project-featured a[href="/projects/claudfather"]').click();
  await expect(page).toHaveURL(/\/projects\/claudfather$/);
  expect(await queuedEvents(page)).toEqual([]);
});
