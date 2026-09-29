import { describe, it, expect } from "vitest";
import { matchPath, matchRoutes, type RouteObject } from "react-router-dom";
import { routes } from "./router";
import { landingPages } from "./seo/prerender";

/**
 * Production serves only the pages the build writes, and 404s everything else
 * (see seo/prerender.ts). These check that list and the router agree, in both
 * directions.
 */

const EXAMPLE = {
  id: "example",
  title: "Example",
  description: "An example project.",
  url: "https://example.com",
};
const pages = landingPages([EXAMPLE]);

/** Path patterns a visitor can land on, e.g. "/projects/:slug". */
const landablePatterns = (tree: RouteObject[], base = ""): string[] =>
  tree.flatMap((route) => {
    if (route.path === "*") return [];
    const pattern =
      route.path === undefined
        ? base
        : route.path.startsWith("/")
          ? route.path
          : `${base.replace(/\/$/, "")}/${route.path}`;
    const own = route.index || route.element ? [pattern || "/"] : [];
    return [...own, ...landablePatterns(route.children ?? [], pattern)];
  });

describe("routes and prerendered pages", () => {
  it("prerenders a page for every route a visitor can land on", () => {
    const patterns = [...new Set(landablePatterns(routes))];
    expect(patterns).toContain("/projects/:slug");

    for (const pattern of patterns) {
      expect(
        pages.some((page) => matchPath(pattern, page.path)),
        `${pattern} has no prerendered page, so it 404s in production`,
      ).toBe(true);
    }
  });

  it("prerenders only pages the app renders, not its catch-all 404", () => {
    for (const page of pages) {
      const matches = matchRoutes(routes, page.path) ?? [];
      expect(
        matches[matches.length - 1]?.route.path,
        `${page.path} is prerendered as a real page, but the app renders its 404 there`,
      ).not.toBe("*");
    }
  });
});
