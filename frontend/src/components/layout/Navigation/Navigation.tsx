import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../../common/ThemeToggle';
import './Navigation.css';

/**
 * Navigation Component
 *
 * Top-level navigation for moving between main pages.
 * Highlights the current active page.
 */
export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
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
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'active'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </div>
    </nav>
  );
}
