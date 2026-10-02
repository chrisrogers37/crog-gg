import { test, expect } from "./fixtures";
import { SECTIONS, SUMMON, bio, site } from "./site";

/**
 * Home page E2E tests: the owner's page, one column (the redesign).
 *
 * Philosophy: test structure and behavior, not copy. The specs read the
 * site's own sections and bio, so they pass on any site and fail only on a
 * broken one.
 */

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("leads with one h1 and the owner's photo", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".home-photo")).toBeVisible();
  });

  test("types its welcome lines", async ({ page }) => {
    // The text cycles, so only that it's there.
    await expect(page.locator(".welcome-typewriter").first()).toBeVisible();
  });

  test("shows site.yaml's sections in its order, each headed by its label", async ({ page }) => {
    for (const { id } of SECTIONS) {
      await expect(page.locator(`#${id} h2`), id).toBeVisible();
    }
    const tops = await Promise.all(
      SECTIONS.map(async ({ id }) => (await page.locator(`#${id}`).boundingBox())!.y),
    );
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
  });

  test("its Connect button lands on the contact section, below the sticky header", async ({ page }) => {
    // Instant scrolling, so the check below sees where the jump lands.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('.page-hero a[href="#contact"]').click();
    await expect(page).toHaveURL(/#contact$/);

    const header = await page.locator("header.compact-header").boundingBox();
    const heading = page.locator("#contact h2");
    await expect(heading).toBeInViewport();
    expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  });

  test("links the email address, and the socials in new tabs", async ({ page }) => {
    await expect(page.locator('#contact a[href^="mailto:"]')).toBeVisible();
    const social = page.locator('#contact a[target="_blank"]').first();
    await expect(social).toBeVisible();
    expect(await social.getAttribute("rel")).toContain("noopener");
  });

  test("shows the location exactly when the bio has one", async ({ page }) => {
    await expect(page.locator("#contact")).toBeVisible();
    const location = page.locator("#contact > .page-note");
    await expect(location).toHaveCount(bio.location ? 1 : 0);
  });

  test("its project cards open their pages on the site (#196 M43)", async ({ page }) => {
    test.skip(!SECTIONS.some(({ id }) => id === "projects"), "the site shows no projects section");
    const card = page.locator("#projects a.project-card").first();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("offers SUMMON under the About text", async ({ page }) => {
    test.skip(!SUMMON, "site.yaml turns SUMMON off");
    await expect(page.locator("#about .generate-btn")).toBeVisible();
  });

  test("has the site's footer", async ({ page }) => {
    await expect(page.locator("footer.footer")).toBeVisible();
  });
});

test.describe("A shared link to a section", () => {
  test("opens on it, with its heading below the header", async ({ page }) => {
    const last = SECTIONS[SECTIONS.length - 1];
    // Mid-page or further, so the browser can bring the section all the way
    // up: only the sections' scroll margin keeps the heading out from under
    // the header.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/#${last.id}`);
    const heading = page.locator(`#${last.id} h2`);
    await expect(heading).toBeInViewport();

    const header = await page.locator("header.compact-header").boundingBox();
    expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  });
});

test.describe("/about, where the owner's page was", () => {
  test("sends its old links home", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Where SUMMON isn't served (#189 M21)", () => {
  // What a deployment with no OpenAI key or no Upstash answers.
  test.use({ features: { regenerate: false, github: true } });

  test("the page offers no regenerate button", async ({ page }) => {
    test.skip(site.features?.regenerate === "on", "site.yaml shows it whatever the API says");
    await page.goto("/");
    await expect(page.locator("#about")).toBeVisible();
    await expect(page.locator(".generate-btn")).toHaveCount(0);
  });
});

test.describe("One file that won't load (#190 M23)", () => {
  test("a timeline that won't load leaves the page up, and the journey names it", async ({ page }) => {
    test.skip(!SECTIONS.some(({ id }) => id === "journey"), "the site shows no journey");
    await page.route("**/content/timeline.yaml", (route) => route.fulfill({ status: 404 }));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const journey = page.locator("#journey");
    await expect(journey.getByRole("alert")).toContainText("content/timeline.yaml");
    await expect(journey.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});
