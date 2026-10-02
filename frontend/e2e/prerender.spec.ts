import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./fixtures";
import { CLAUDLOBBY_CARD } from "../src/content/claudlobbyBrand";
import { CLAUDLOBBY, cardOf, servedProjects, site } from "./site";

/**
 * The crawler's view (#174): each page's raw HTML with no JavaScript run,
 * fetched from a production build under `vite preview` (see the "prerender"
 * project in playwright.config.ts), so this exercises what the build plugin
 * actually writes. It checks structure (which tags, naming which URL), not
 * copy. The 404 *status* comes from Vercel's routing and preview cannot
 * reproduce it, so only the 404 page's head is checked here.
 */

/** The entities renderHead escapes, decoded the way a browser does. */
const decode = (text: string | undefined) =>
  text
    ?.replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const readHead = async (request: APIRequestContext, path: string) => {
  const response = await request.get(path);
  expect(response.status(), `${path} status`).toBe(200);
  const html = await response.text();
  const first = (pattern: RegExp) => html.match(pattern)?.[1];
  return {
    title: decode(first(/<title>([^<]*)<\/title>/)),
    description: first(/name="description" content="([^"]*)"/),
    canonical: first(/rel="canonical" href="([^"]+)"/),
    ogTitles: html.match(/property="og:title"/g)?.length ?? 0,
    ogImage: first(/property="og:image" content="([^"]+)"/),
    twitterCard: first(/name="twitter:card" content="([^"]+)"/),
    robots: first(/name="robots" content="([^"]+)"/),
  };
};

const expectLandingHead = async (
  request: APIRequestContext,
  path: string,
) => {
  const head = await readHead(request, path);
  expect(head.title, `${path} title`).toBeTruthy();
  expect(head.description, `${path} description`).toBeTruthy();
  expect(head.ogTitles, `${path} og:title count`).toBe(1);
  expect(head.twitterCard, `${path} twitter:card`).toBe("summary_large_image");
  // Crawlers resolve nothing, so the card image must be an absolute URL: the
  // site's card (or the page's own), on its canonical origin.
  expect(head.ogImage, `${path} og:image`).toBe(`${site.site.url}${cardOf(path).path}`);
  expect(head.robots, `${path} robots`).toBeUndefined();
  expect(new URL(head.canonical ?? "").pathname, `${path} canonical`).toBe(path);
  return head;
};

test.describe("Prerendered heads", () => {
  test("home and the projects ship their own heads, and /about none", async ({
    request,
  }) => {
    for (const path of ["/", "/projects"]) {
      await expectLandingHead(request, path);
    }
    // vercel.json sends /about home (router.test.tsx holds it to that), so
    // the build writes no page for it, and the sitemap names none.
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toMatch(/\/about</);
  });

  test("every indexed project ships a head naming that project", async ({
    request,
  }) => {
    const projects = await servedProjects(request);
    expect(projects.length).toBeGreaterThan(0);

    for (const project of projects) {
      const head = await expectLandingHead(request, `/projects/${project.id}`);
      expect(head.title).toContain(project.title);
    }
  });

  test("the sitemap lists every landing page on the canonical host, and robots points at it", async ({
    request,
  }) => {
    const canonical = await readHead(request, "/");
    const origin = new URL(canonical.canonical ?? "").origin;

    const sitemap = await (await request.get("/sitemap.xml")).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(2);
    for (const loc of locs) {
      expect(new URL(loc).origin, loc).toBe(origin);
      // Every URL it lists is a page the build wrote.
      await expectLandingHead(request, new URL(loc).pathname);
    }

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });

  test("the 404 page is noindex and names no canonical", async ({
    request,
  }) => {
    const head = await readHead(request, "/404.html");
    expect(head.robots).toContain("noindex");
    expect(head.canonical).toBeUndefined();
  });

  test("the assets the heads point at exist with real content types", async ({
    request,
  }) => {
    // The card and the Person schema's photo, from site.yaml, and what
    // index.html links: each served with an image or JSON type.
    for (const [path, type] of [
      [site.seo.image.path, "image/"],
      [site.owner.image, "image/"],
      ["/apple-touch-icon.png", "image/png"],
      ["/manifest.json", "application/json"],
      // Claudlobby's page's own card, where the site lists it.
      ...(CLAUDLOBBY ? [[CLAUDLOBBY_CARD.path, "image/png"]] : []),
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"], path).toContain(type);
    }
  });
});
