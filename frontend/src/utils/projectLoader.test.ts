import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadProjects } from "./projectLoader";

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
order: 1
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

    await expect(loadProjects()).rejects.toThrow(/did not parse to a project/);
  });

  it("refuses an index that does not exist, rather than falling back to a different portfolio", async () => {
    globalThis.fetch = serve({
      "/content/projects/index.yaml": null, // served the SPA HTML, status 200
    });

    await expect(loadProjects()).rejects.toThrow(/did not parse to/);
  });

  it("refuses a non-ok index response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.resolve(""),
    });

    await expect(loadProjects()).rejects.toThrow(
      /Failed to fetch project index/,
    );
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
