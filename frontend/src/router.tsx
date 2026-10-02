import { Suspense } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import site from "virtual:site-config";
import type { Home } from "./config/schema";

// Layout (loaded immediately as it's the shell)
import { Layout } from "./components/layout";

// NotFound page loaded immediately for fast 404 response
import { NotFoundPage } from "./pages/NotFound";

// What a route shows when its page throws or its chunk won't load
import { RouteError } from "./pages/RouteError";
import { lazyPage } from "./utils/lazyPage";

// HomePage is the likely first visit, so it is eager and kept light
import { HomePage } from "./pages/Home";

// Lazy-loaded pages: /about carries the personal page's sections and motion,
// the project pages react-markdown and highlight.js
const AboutPage = lazyPage(() =>
  import("./pages/About/AboutPage").then((m) => ({
    default: m.AboutPage,
  })),
);
const ProjectsPage = lazyPage(() =>
  import("./pages/Projects/ProjectsPage").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ProjectDetailPage = lazyPage(() =>
  import("./pages/Projects/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);

/**
 * Loading fallback for lazy-loaded components. Full height, so the footer
 * doesn't jump when the page it stands in for arrives.
 */
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper for lazy-loaded pages
 */
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

/**
 * Application Router Configuration
 *
 * Routes, with site.yaml's `home: landing` (#188):
 * /                    - Home page (Claudlobby)
 * /about               - About (the personal page)
 * /projects            - Projects listing
 * /projects/:slug      - Individual project detail
 * /*                   - 404 Not Found
 *
 * With `home: profile`, the personal page is / and there's no /about.
 *
 * Every landable route needs a prerendered page in seo/prerender.ts, or it
 * 404s in production (#174); router.test.tsx checks the two agree.
 */
// Exported for router.test.tsx. This module is the app root, which Fast Refresh
// reloads in full anyway, so the component-only-exports rule buys nothing here.
// eslint-disable-next-line react-refresh/only-export-components
export function routesFor(home: Home): RouteObject[] {
  const about = {
    // The personal page draws its own full-width card (Layout.tsx).
    handle: { fullBleed: true },
    element: (
      <LazyPage>
        <AboutPage />
      </LazyPage>
    ),
    errorElement: <RouteError />,
  };

  return [
    {
      path: "/",
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        ...(home === "landing"
          ? [
              {
                index: true,
                element: <HomePage />,
                errorElement: <RouteError />,
              },
              { path: "about", ...about },
            ]
          : [{ index: true, ...about }]),
        {
          path: "projects",
          errorElement: <RouteError />,
          children: [
            {
              index: true,
              element: (
                <LazyPage>
                  <ProjectsPage />
                </LazyPage>
              ),
            },
            {
              path: ":slug",
              element: (
                <LazyPage>
                  <ProjectDetailPage />
                </LazyPage>
              ),
            },
          ],
        },
        // Inside the Layout, so a 404 keeps the site's header, footer and its
        // one <main> landmark.
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ];
}

/** The routes for the shipped site.yaml. */
// eslint-disable-next-line react-refresh/only-export-components
export const routes = routesFor(site.home);

const router = createBrowserRouter(routes);

/**
 * AppRouter Component
 *
 * Provides the router context to the application.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
