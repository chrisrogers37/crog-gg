import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout
import { Layout } from './components/layout';

// Pages
import { HomePage } from './pages/Home';
import { ProjectsPage, ProjectDetailPage } from './pages/Projects';
import { NotFoundPage } from './pages/NotFound';

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
            element: <ProjectsPage />,
          },
          {
            path: ':slug',
            element: <ProjectDetailPage />,
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
