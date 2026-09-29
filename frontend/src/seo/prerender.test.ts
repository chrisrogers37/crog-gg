import { beforeAll, describe, it, expect } from "vitest";
import {
  HEAD_MARKER,
  fileFor,
  landingPages,
  pageFor,
  renderHead,
  renderPage,
} from "./prerender";
import { HOME_META, NOT_FOUND_META, SITE_URL, type PageMeta } from "./site";
import { readProjects } from "../utils/projectLoader";
import type { Project } from "../types/Project";

// The shipped content, read through Vite so a moved file fails here.
const contentFiles = import.meta.glob<string>(
  "../../public/content/projects/*.yaml",
  { query: "?raw", import: "default", eager: true },
);

const TEMPLATE = `<!doctype html><html><head>\n    ${HEAD_MARKER}\n  </head><body><div id="root"></div></body></html>`;

describe("renderPage", () => {
  it("refuses a template without the marker instead of shipping a page with no head", () => {
    expect(() => renderPage("<head></head>", HOME_META)).toThrow(HEAD_MARKER);
  });

  it("writes the title and marks every other tag for react-helmet-async to adopt", () => {
    const html = renderPage(TEMPLATE, HOME_META);
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
    const html = renderPage(TEMPLATE, hostile);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("writes a $ in page text literally rather than as a replacement pattern", () => {
    const html = renderPage(TEMPLATE, { path: "/x", description: "costs $& and $1" });
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
    projects = await readProjects(async (file) => {
      const text = contentFiles[`../../public/content/projects/${file}`];
      if (text === undefined) throw new Error(`index.yaml lists ${file}, which does not exist`);
      return text;
    });
  });

  it("covers the home page, the projects page and every indexed project, in index order", () => {
    expect(landingPages(projects).map((page) => page.path)).toEqual([
      "/",
      "/projects",
      ...projects.map((project) => `/projects/${project.id}`),
    ]);
  });

  it("gives each project page its own title, description and canonical", () => {
    for (const project of projects) {
      const head = renderHead(pageFor(`/projects/${project.id}`, projects));
      expect(head).toContain(`<title>${project.title} | `);
      expect(head).toContain(`href="${SITE_URL}/projects/${project.id}"`);
      expect(head).toMatch(/name="description" content="[^"]+"/);
    }
  });

  it("gives any other path the noindex 404 head", () => {
    expect(pageFor("/projects/does-not-exist", projects)).toBe(NOT_FOUND_META);
    expect(renderHead(NOT_FOUND_META)).toContain('content="noindex, nofollow"');
  });
});
