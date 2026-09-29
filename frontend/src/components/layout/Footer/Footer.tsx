import { Link } from "react-router-dom";
import { CLAUDLOBBY_REPO } from "../../../content/links";
import "./Footer.css";

const PROFILE_LINKS = [
  { href: "https://github.com/chrisrogers37", label: "GitHub" },
  { href: "https://linkedin.com/in/chrisrogers37", label: "LinkedIn" },
];

/**
 * Footer Component
 *
 * Simple footer with copyright and links.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {currentYear} Chris Rogers. All rights reserved.
        </p>
        <div className="footer-links">
          <a href={CLAUDLOBBY_REPO} target="_blank" rel="noopener noreferrer">
            Claudlobby
          </a>
          <Link to="/about">About</Link>
          {PROFILE_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
