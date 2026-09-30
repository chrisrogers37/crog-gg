import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { matchPath, matchRoutes, type RouteObject } from "react-router-dom";
import { routes } from "./router";
import { landingPages } from "./seo/prerender";
import { NotFoundPage } from "./pages/NotFound";
import { RouteError } from "./pages/RouteError";

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

type RouteEntry = { route: RouteObject; pattern: string };

/** Every route in the tree with its full path pattern, e.g. "/projects/:slug". */
const routeEntries = (tree: RouteObject[], base = ""): RouteEntry[] =>
  tree.flatMap((route) => {
    const pattern =
      route.path === undefined
        ? base
        : route.path.startsWith("/")
          ? route.path
          : `${base.replace(/\/$/, "")}/${route.path}`;
    return [
      { route, pattern: pattern || "/" },
      ...routeEntries(route.children ?? [], pattern),
    ];
  });

/**
 * Path patterns a visitor can land on, but "*". React Router's own rule: a
 * route matches a URL by itself if it has a path or is an index route.
 */
const landablePatterns = (tree: RouteObject[]): string[] => [
  ...new Set(
    routeEntries(tree)
      .filter(
        ({ route }) =>
          route.path !== "*" && (route.path !== undefined || route.index),
      )
      .map(({ pattern }) => pattern),
  ),
];

describe("routes and prerendered pages", () => {
  it("prerenders a page for every route a visitor can land on", () => {
    const patterns = landablePatterns(routes);
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

  it("keeps the 404 page for unmatched URLs and RouteError for every error", () => {
    const unmatched = matchRoutes(routes, "/no-such-page") ?? [];
    expect(unmatched[unmatched.length - 1]?.route.path).toBe("*");

    // NotFoundPage marks a URL noindex, so a real page that fails to render
    // (or a stale lazy chunk) must not fall back to it (#196 M40).
    for (const { route, pattern } of routeEntries(routes)) {
      const name = route.index ? `${pattern} (index)` : pattern;
      if (route.errorElement) {
        expect((route.errorElement as ReactElement).type, name).toBe(
          RouteError,
        );
      }
      const rendersNotFound =
        (route.element as ReactElement | undefined)?.type === NotFoundPage;
      expect(rendersNotFound, name).toBe(route.path === "*");
    }
  });
});
