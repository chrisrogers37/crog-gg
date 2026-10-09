import { Suspense } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

// Layout (loaded immediately as it's the shell)
import { Layout } from "./components/layout";

// NotFound page loaded immediately for fast 404 response
import { NotFoundPage } from "./pages/NotFound";

// What a route shows when its page throws or its chunk won't load
import { RouteError } from "./pages/RouteError";
import { lazyPage } from "./utils/lazyPage";

// Lazy-loaded pages: the home page carries its sections and motion, and its
// chunk loads beside the content fetch; the project pages react-markdown and
// highlight.js
const HomePage = lazyPage(() =>
  import("./pages/Home/HomePage").then((m) => ({
    default: m.HomePage,
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
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
 * /                    - Home: the owner's page
 * /projects            - Projects listing
 * /projects/:slug      - Individual project detail
 * /*                   - 404 Not Found
 *
 * /about, where the owner's page was from #173 until the redesign, sends its
 * old links home: vercel.json redirects it, and so does the router, for a
 * link inside the app.
 *
 * Every landable route needs a prerendered page in seo/prerender.ts, or it
 * 404s in production (#174); router.test.tsx checks the two agree.
 */
// Exported for router.test.tsx. This module is the app root, which Fast Refresh
// reloads in full anyway, so the component-only-exports rule buys nothing here.
// eslint-disable-next-line react-refresh/only-export-components
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <HomePage />
          </LazyPage>
        ),
        errorElement: <RouteError />,
      },
      { path: "about", element: <Navigate to="/" replace /> },
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

const router = createBrowserRouter(routes);

/**
 * AppRouter Component
 *
 * Provides the router context to the application.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
