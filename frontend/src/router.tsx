import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout (loaded immediately as it's the shell)
import { Layout } from './components/layout';

// NotFound page loaded immediately for fast 404 response
import { NotFoundPage } from './pages/NotFound';

// Lazy-loaded pages for code splitting
// HomePage is likely first visit, so keep it eager
import { HomePage } from './pages/Home';

// Project pages are lazy-loaded since they have heavy dependencies (react-markdown, highlight.js)
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/Projects/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));

/**
 * Loading fallback for lazy-loaded components
 */
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
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
 * Routes:
 * /                    - Home page (portfolio)
 * /projects            - Projects listing
 * /projects/:slug      - Individual project detail
 * /*                   - 404 Not Found
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'projects',
        children: [
          {
            index: true,
            element: <LazyPage><ProjectsPage /></LazyPage>,
          },
          {
            path: ':slug',
            element: <LazyPage><ProjectDetailPage /></LazyPage>,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

/**
 * AppRouter Component
 *
 * Provides the router context to the application.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
