import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../../common/ThemeToggle";
import { GitHubMark } from "../../common/GitHubMark";
import { CLAUDLOBBY_REPO } from "../../../content/links";
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

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/projects", label: "Projects" },
  ];

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        Chris Rogers
      </Link>

      <div className="nav-right">
        <ul className="nav-links">
          {navItems.map((item) => (
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
        <a
          className="btn btn-ghost btn-sm nav-repo"
          href={CLAUDLOBBY_REPO}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubMark />
          <span>Claudlobby</span>
        </a>
        <ThemeToggle />

        {/* Hamburger button - visible on mobile only */}
        <button
          className="nav-hamburger"
          onClick={toggleMobileMenu}
          aria-label="Open menu"
        >
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
        </button>
      </div>
    </nav>
  );
}
