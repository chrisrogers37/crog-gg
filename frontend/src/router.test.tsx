import type { ReactElement } from "react";
import { beforeAll, describe, it, expect } from "vitest";
import { matchPath, matchRoutes, type RouteObject } from "react-router-dom";
import { routes } from "./router";
import { landingPages } from "./seo/prerender";
import { NotFoundPage } from "./pages/NotFound";
import { RouteError } from "./pages/RouteError";
import { shippedProjects } from "./test/content";

/**
 * Production serves only the pages the build writes, and 404s everything else
 * (see seo/prerender.ts). These check that list and the router agree, in both
 * directions.
 */

type RouteEntry = {
  route: RouteObject;
  /** Its full path pattern, e.g. "/projects/:slug". */
  pattern: string;
  /** Outermost first, so `ancestors[0]` is the root. */
  ancestors: RouteObject[];
};

/** Every route in the tree. */
const routeEntries = (
  tree: RouteObject[],
  base = "",
  ancestors: RouteObject[] = [],
): RouteEntry[] =>
  tree.flatMap((route) => {
    const pattern =
      route.path === undefined
        ? base
        : route.path.startsWith("/")
          ? route.path
          : `${base.replace(/\/$/, "")}/${route.path}`;
    return [
      { route, pattern: pattern || "/", ancestors },
      ...routeEntries(route.children ?? [], pattern, [...ancestors, route]),
    ];
  });

const isRouteError = (element: RouteObject["errorElement"]) =>
  (element as ReactElement | undefined)?.type === RouteError;

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
  // Over the shipped projects, so a project id the router can't match (one
  // with a slash, say) fails here instead of shipping a 200 that shows a 404.
  let pages: ReturnType<typeof landingPages>;
  beforeAll(async () => {
    pages = landingPages(await shippedProjects());
  });

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
    expect(isRouteError(routes[0].errorElement), "the root").toBe(true);
    for (const { route, pattern, ancestors } of routeEntries(routes)) {
      const name = route.index ? `${pattern} (index)` : pattern;
      if (route.errorElement) {
        expect(isRouteError(route.errorElement), name).toBe(true);
      }
      const rendersNotFound =
        (route.element as ReactElement | undefined)?.type === NotFoundPage;
      expect(rendersNotFound, name).toBe(route.path === "*");

      // Every page's errors land inside Layout: on the page's own route or a
      // route between it and the root.
      const isPage =
        ancestors.length > 0 &&
        route.path !== "*" &&
        (route.path !== undefined || route.index);
      if (isPage) {
        const caught = [route, ...ancestors.slice(1)].some((r) =>
          isRouteError(r.errorElement),
        );
        expect(caught, `${name} has no RouteError inside Layout`).toBe(true);
      }
    }
  });
});
