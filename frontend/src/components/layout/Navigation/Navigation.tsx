import { Link, useLocation } from "react-router";
import site from "virtual:site-config";
import { ThemeToggle } from "../../common/ThemeToggle";
import { GitHubMark } from "../../common/GitHubMark";
import { RepoLink } from "../../common/RepoLink";
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

  // With `home: profile`, the personal page is / (#188).
  const landing = site.home === "landing";
  const navItems = [
    ...(landing
      ? [
          { path: "/", label: "Home" },
          { path: "/about", label: "About" },
        ]
      : [{ path: "/", label: "About" }]),
    { path: "/projects", label: "Projects" },
  ];

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        {site.owner.name}
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
        {landing && (
          <RepoLink location="header" className="btn btn-ghost btn-sm nav-repo">
            <GitHubMark />
            <span>Claudlobby</span>
          </RepoLink>
        )}
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
