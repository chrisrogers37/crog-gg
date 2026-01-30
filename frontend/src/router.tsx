import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { NotFoundPage } from './pages/NotFound';

/**
 * Application Router Configuration
 *
 * Routes:
 * /  - Home page (portfolio)
 * /* - 404 Not Found (catch-all)
 *
 * Phase 3 will add:
 * /projects          - Projects listing
 * /projects/:slug    - Individual project detail
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <NotFoundPage />,
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
