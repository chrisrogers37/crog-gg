import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { MobileMenu } from "../MobileMenu";
import { useContentLoader } from "../../../hooks";
import "./Layout.css";

/**
 * Layout Component
 *
 * Provides consistent structure across all pages:
 * - Compact header with navigation on non-home pages
 * - Main content area (via Outlet)
 * - Footer
 *
 * Note: The home page handles its own full header.
 */
export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Load content here rather than in a page component: Layout wraps every
  // route, so content is fetched no matter which route the user enters on.
  useContentLoader();

  return (
    <div className="layout">
      {/* Show navigation header on non-home pages */}
      {!isHomePage && (
        <header className="compact-header">
          <Navigation />
        </header>
      )}

      {/* Main content - renders child routes */}
      <main className={`layout-main ${isHomePage ? "home-layout" : ""}`}>
        <Outlet />
      </main>

      {/* Footer on all pages */}
      <Footer />

      {/* Mobile menu for non-home pages */}
      {!isHomePage && <MobileMenu />}
    </div>
  );
}
