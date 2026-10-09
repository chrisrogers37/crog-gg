import { test, expect } from "./fixtures";
import { SECTIONS } from "./site";

test("mobile navigation contains keyboard focus and restores its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  const close = dialog.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // A top-layer modal makes even programmatic background focus ineffective.
  await page.locator("header .nav-logo").evaluate((element: HTMLElement) => element.focus());
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: /current theme/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("reduced motion shows offscreen timeline content without entrance transforms", async ({ page }) => {
  test.skip(!SECTIONS.some(({ id }) => id === "journey"), "this site hides the journey");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const entries = page.locator(".timeline-entry");
  await expect(entries.first()).toBeAttached();
  for (const entry of await entries.all()) {
    await expect(entry).toHaveCSS("opacity", "1");
    await expect(entry).toHaveCSS("transform", "none");
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
});

test("the static photo strip shows each photo once and scrolls with the keyboard", async ({ page }) => {
  const images = Array.from({ length: 5 }, (_, index) => ({
    src: `/profile-photos/fixture-${index}`,
    alt: `Fixture photo ${index + 1}`,
  }));
  await page.route("**/content/showcase.yaml", (route) => route.fulfill({ json: { images } }));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const strip = page.locator(".image-showcase");
  await expect(strip.locator("img")).toHaveCount(images.length);
  await expect(strip.locator(".image-showcase-track")).toHaveCSS("animation-name", "none");
  await strip.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => strip.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("an embedded demo expands without reloading, then Escape restores focus", async ({ page }) => {
  await page.route("**/content/projects/index.yaml", (route) => route.fulfill({
    json: { projects: ["demo-fixture.yaml"] },
  }));
  await page.route("**/content/projects/demo-fixture.yaml", (route) => route.fulfill({
    json: {
      id: "demo-fixture", title: "Demo fixture", description: "A keyboard fixture.",
      icon: "🧪", category: "tools", url: "https://example.org/", demo: "https://demo.example.org/",
    },
  }));
  await page.route("https://demo.example.org/", (route) => route.fulfill({
    contentType: "text/html", body: '<label>Draft <input aria-label="Draft"></label>',
  }));
  await page.goto("/projects/demo-fixture");
  const input = page.frameLocator(".demo-iframe").getByRole("textbox", { name: "Draft" });
  await input.fill("keep this state");
  const toggle = page.getByRole("button", { name: /fullscreen/ });
  await toggle.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Demo fixture demo" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toBeFocused();
  await expect(input).toHaveValue("keep this state");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAttribute("aria-modal", "false");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(input).toHaveValue("keep this state");
  await expect(page.getByRole("heading", { name: "live demo", exact: true })).toHaveCount(1);
});
