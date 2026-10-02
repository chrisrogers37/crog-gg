import { test, expect } from "@playwright/test";

/**
 * Analytics in the production build (#177). Vercel serves the real script
 * once Web Analytics is enabled on the project; `vite preview` answers with
 * an empty one (vite.config.ts), so events stay in the queue
 * @vercel/analytics keeps for it: exactly what the page hands the real script.
 * Links are found by where they go, not by their copy.
 */

const REPO = "https://github.com/Claudfather/Claudlobby";

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
});

test("reports each CTA click once, with where it was", async ({ page }) => {
  await page.goto("/");

  await page.locator(`.cl-hero a[href="${REPO}"]`).click();
  await page.locator('.cl-hero a[href="#quickstart"]').click();
  await page.locator(`footer a[href="${REPO}"]`).click();

  // The filter the real script is handed keeps utm_* tags and drops every
  // other query parameter and the fragment...
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
  // ...and each click is reported once.
  const events = await page.evaluate(() =>
    (window.vaq ?? []).filter(([type]) => type === "event"),
  );
  expect(events).toEqual([
    ["event", { name: "repo_click", data: { location: "hero" } }],
    ["event", { name: "quickstart_click", data: {} }],
    ["event", { name: "repo_click", data: { location: "footer" } }],
  ]);
  expect(await page.context().cookies()).toEqual([]);
});
