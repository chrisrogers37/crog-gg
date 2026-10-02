import { beforeAll, describe, it, expect } from "vitest";
import {
  HEAD_MARKER,
  fileFor,
  landingPages,
  pageFor,
  renderHead,
  renderPage,
  renderRobots,
  renderSitemap,
} from "./prerender";
import {
  HOME_META,
  NOT_FOUND_META,
  SITE_URL,
  projectMeta,
  seo,
  type PageMeta,
} from ".";
import { shippedProjects } from "../test/content";
import type { Project } from "../types/Project";

/** A head as a browser reads it, entities decoded. */
const parseHead = (head: string) =>
  new DOMParser().parseFromString(`<head>${head}</head>`, "text/html");

const TEMPLATE = `<!doctype html><html><head>\n    ${HEAD_MARKER}\n  </head><body><div id="root"></div></body></html>`;

describe("renderPage", () => {
  it("refuses a template without the marker instead of shipping a page with no head", () => {
    expect(() => renderPage(seo, "<head></head>", HOME_META)).toThrow(HEAD_MARKER);
  });

  it("writes the title and marks every other tag for react-helmet-async to adopt", () => {
    const html = renderPage(seo, TEMPLATE, HOME_META);
    expect(html).not.toContain(HEAD_MARKER);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    const tags = html.match(/<(meta|link|script)\b[^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThan(10);
    for (const tag of tags) expect(tag).toContain('data-rh="true"');
  });

  it("escapes page text so it cannot break out of an attribute or the head", () => {
    const hostile: PageMeta = {
      path: "/x",
      title: "</title><script>alert(1)</script>",
      description: '"><script>alert(1)</script>',
    };
    const html = renderPage(seo, TEMPLATE, hostile);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("writes a $ in page text literally rather than as a replacement pattern", () => {
    const html = renderPage(seo, TEMPLATE, {
      path: "/x",
      title: "x",
      description: "costs $& and $1",
    });
    expect(html).toContain("costs $&amp; and $1");
  });
});

describe("fileFor", () => {
  it("names the file cleanUrls serves at each path", () => {
    expect(fileFor("/")).toBe("index.html");
    expect(fileFor("/projects")).toBe("projects.html");
    expect(fileFor("/projects/storydump")).toBe("projects/storydump.html");
  });
});

describe("landingPages, over the shipped content", () => {
  let projects: Project[];
  beforeAll(async () => {
    projects = await shippedProjects();
  });

  it("covers the site's own pages and every indexed project, in index order", () => {
    expect(landingPages(seo, projects).map((page) => page.path)).toEqual([
      ...seo.PAGES.map((page) => page.path),
      ...projects.map((project) => `/projects/${project.id}`),
    ]);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("gives each project page its own title, description and canonical", () => {
    for (const project of projects) {
      const head = renderHead(seo, pageFor(seo, `/projects/${project.id}`, projects));
      expect(parseHead(head).title).toContain(`${project.title} | `);
      expect(head).toContain(`href="${SITE_URL}/projects/${project.id}"`);
      expect(head).toMatch(/name="description" content="[^"]+"/);
    }
  });

  it("escapes what a project's YAML says, in the tags and in the JSON-LD", () => {
    const hostile = {
      id: "q-and-a",
      title: 'Q&A Bot </script><script>alert(1)</script> "$&"',
      description: "Ask & answer <b>now</b>",
      url: "https://example.com",
    };
    const head = renderHead(seo, projectMeta(hostile));
    const doc = parseHead(head);

    expect(doc.title).toContain(hostile.title);
    expect(doc.querySelectorAll("script:not([type])")).toHaveLength(0);
    const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')];
    expect(ld.length).toBeGreaterThan(0);
    for (const script of ld) {
      expect(script.textContent).not.toContain("<");
      expect(JSON.stringify(JSON.parse(script.textContent ?? ""))).toContain(
        "Q&A Bot",
      );
    }
  });

  it("lists exactly the landing pages in the sitemap, on the canonical host", () => {
    const sitemap = renderSitemap(seo, landingPages(seo, projects), "2026-09-29");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(
      landingPages(seo, projects).map((page) => `${SITE_URL}${page.path}`),
    );
    expect(sitemap.match(/<lastmod>2026-09-29<\/lastmod>/g)).toHaveLength(locs.length);
  });

  it("points robots.txt at the sitemap on the canonical host", () => {
    expect(renderRobots(seo)).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it("gives any other path the noindex 404 head", () => {
    expect(pageFor(seo, "/projects/does-not-exist", projects)).toBe(NOT_FOUND_META);
    expect(renderHead(seo, NOT_FOUND_META)).toContain('content="noindex, nofollow"');
  });
});
