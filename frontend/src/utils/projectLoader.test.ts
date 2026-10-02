import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadProjects, readProjects } from "./projectLoader";

/**
 * The defect these guard is silent by construction: the SPA rewrite answers a
 * missing static asset with index.html and status 200, and js-yaml turns that
 * HTML into a string rather than throwing. Neither the status check nor the
 * parse reports it, so the loader used to build a project out of `undefined`
 * fields and render a blank card as though it were real work.
 *
 * So each case below asserts the loader REFUSES, not that it copes. Rendering
 * something is the bug.
 */

const SPA_HTML = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div></body></html>`;

const INDEX_YAML = `projects:
  - shuffify.yaml
`;

const SHUFFIFY_YAML = `id: shuffify
title: Shuffify
description: A better way to manage your Spotify playlists
icon: music
category: web
`;

/** Route each URL to a canned body, the way the deployment actually would. */
const serve = (routes: Record<string, string | null>) =>
  vi.fn().mockImplementation((url: string) => {
    const body = routes[url];
    // null means "the origin has no such file" -- which in production is NOT a
    // 404, it is the SPA fallback: 200 with an HTML document.
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve(body === null ? SPA_HTML : body),
    });
  });

describe("loadProjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the projects the index lists", async () => {
    globalThis.fetch = serve({
      "/content/projects/index.yaml": INDEX_YAML,
      "/content/projects/shuffify.yaml": SHUFFIFY_YAML,
    });

    const projects = await loadProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("shuffify");
    expect(projects[0].title).toBe("Shuffify");
  });

  it("refuses a project file that does not exist, rather than rendering a blank card", async () => {
    globalThis.fetch = serve({
      "/content/projects/index.yaml": INDEX_YAML,
      "/content/projects/shuffify.yaml": null, // served the SPA HTML, status 200
    });

    await expect(loadProjects()).rejects.toThrow(
      /content\/projects\/shuffify\.yaml has 1 problem\(s\):\n {2}- the file: expected a mapping/,
    );
  });

  it("refuses an index that does not exist, rather than falling back to a different portfolio", async () => {
    globalThis.fetch = serve({
      "/content/projects/index.yaml": null, // served the SPA HTML, status 200
    });

    await expect(loadProjects()).rejects.toThrow(
      /content\/projects\/index\.yaml has 1 problem\(s\):\n {2}- the file: expected a mapping/,
    );
  });

  it("refuses a non-ok index response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve(""),
    });

    await expect(loadProjects()).rejects.toThrow("content/projects/index.yaml answered 500");
  });

  it("does not invent projects the index omits", async () => {
    // hedwig.yaml is present on disk but deliberately absent from the index.
    // The removed hardcoded fallback named it, so an index failure used to
    // surface it. Nothing should reach for a file the index does not list.
    const fetchMock = serve({
      "/content/projects/index.yaml": INDEX_YAML,
      "/content/projects/shuffify.yaml": SHUFFIFY_YAML,
      "/content/projects/hedwig.yaml": "id: hedwig\ntitle: Hedwig\n",
    });
    globalThis.fetch = fetchMock;

    const projects = await loadProjects();

    expect(projects.map((p) => p.id)).toEqual(["shuffify"]);
    expect(fetchMock).not.toHaveBeenCalledWith("/content/projects/hedwig.yaml");
  });
});

describe("readProjects", () => {
  const readOne = (yaml: string) =>
    readProjects(async (file) =>
      file === "index.yaml" ? "projects:\n  - broken.yaml\n" : yaml,
    );

  const VALID = "id: a-b\ntitle: A\ndescription: B\nicon: x\ncategory: c\n";

  it("rejects an id that can't be one URL segment, naming the file", async () => {
    await expect(readOne(VALID.replace("id: a-b", "id: a/b"))).rejects.toThrow(
      /content\/projects\/broken\.yaml has 1 problem\(s\):\n {2}- id: expected a lowercase id/,
    );
  });

  it("rejects a project without a description, naming the file (#190 M22)", async () => {
    // Search lower-cased every description, so one without took the page down.
    await expect(readOne(VALID.replace("description: B\n", ""))).rejects.toThrow(
      /content\/projects\/broken\.yaml has 1 problem\(s\):\n {2}- description: missing/,
    );
  });

  it("names every problem in a file, and a key it doesn't know (#190 M22)", async () => {
    const error = await readOne(`${VALID}order: 2\nurl: http://a.example\n`).catch((e) => e);
    expect(error.message).toContain("  - order: unknown key");
    expect(error.message).toContain("  - url: expected an https URL");
  });

  it("falls back from url to the demo, then the repo", async () => {
    const [repoOnly] = await readOne(`${VALID}github: https://github.com/a/b\n`);
    expect(repoOnly.url).toBe("https://github.com/a/b");
    const [both] = await readOne(`${VALID}demo: https://d.example\ngithub: https://github.com/a/b\n`);
    expect(both.url).toBe("https://d.example");
  });

  it("checks links where the browser has no URL.canParse (Safari 16)", async () => {
    const canParse = URL.canParse;
    Object.defineProperty(URL, "canParse", { value: undefined, configurable: true });
    try {
      const [project] = await readOne(`${VALID}url: https://a.example\n`);
      expect(project.url).toBe("https://a.example");
    } finally {
      Object.defineProperty(URL, "canParse", { value: canParse, configurable: true });
    }
  });

  it("refuses an index that lists a file twice", async () => {
    await expect(
      readProjects(async (file) =>
        file === "index.yaml" ? "projects:\n  - a.yaml\n  - a.yaml\n" : VALID,
      ),
    ).rejects.toThrow("content/projects/index.yaml lists a.yaml twice");
  });

  it("keeps index.yaml's order", async () => {
    const files: Record<string, string> = {
      "index.yaml": "projects:\n  - zeta.yaml\n  - alpha.yaml\n  - mid.yaml\n",
      "zeta.yaml": VALID.replace("a-b", "zeta"),
      "alpha.yaml": VALID.replace("a-b", "alpha"),
      "mid.yaml": VALID.replace("a-b", "mid"),
    };
    const projects = await readProjects(async (file) => files[file]);
    expect(projects.map((project) => project.id)).toEqual(["zeta", "alpha", "mid"]);
  });

  it("marks the one project index.yaml features, and only that one", async () => {
    const files: Record<string, string> = {
      "index.yaml": "featured: b.yaml\nprojects:\n  - a.yaml\n  - b.yaml\n",
      "a.yaml": VALID.replace("a-b", "a"),
      "b.yaml": VALID.replace("a-b", "b"),
    };
    const projects = await readProjects(async (file) => files[file]);
    expect(projects.map((project) => [project.id, project.featured])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });

  it("features nothing when index.yaml names none", async () => {
    const projects = await readOne(VALID);
    expect(projects.map((project) => project.featured)).toEqual([false]);
  });

  it("refuses to feature a file the index doesn't list", async () => {
    await expect(
      readProjects(async (file) =>
        file === "index.yaml" ? "featured: z.yaml\nprojects:\n  - a.yaml\n" : VALID,
      ),
    ).rejects.toThrow("content/projects/index.yaml features z.yaml, which it doesn't list");
  });
});
