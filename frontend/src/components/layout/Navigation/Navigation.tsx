import { Link, useLocation } from "react-router";
import site from "virtual:site-config";
import { SITE_PAGES } from "../../../config/pages";
import { ThemeToggle } from "../../common/ThemeToggle";
import { useUIStore } from "../../../store";
import "./Navigation.css";

/**
 * Navigation Component
 *
 * Top-level navigation for moving between main pages.
 * Highlights the current active page.
 */
export function Navigation() {
  const location = useLocation();
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        {site.owner.name}
      </Link>

      <div className="nav-right">
        <ul className="nav-links">
          {SITE_PAGES.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "active"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />

        {/* Hamburger button - visible on mobile only */}
        <button
          className="nav-hamburger"
          onClick={toggleMobileMenu}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-haspopup="dialog"
        >
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
        </button>
      </div>
    </nav>
  );
}
