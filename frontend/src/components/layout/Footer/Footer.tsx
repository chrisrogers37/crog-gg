import { Link } from "react-router-dom";
import { PROFILE_URLS } from "../../../content/links";
import { RepoLink } from "../../common/RepoLink";
import "./Footer.css";

const PROFILE_LINKS = [
  { href: PROFILE_URLS.github, label: "GitHub" },
  { href: PROFILE_URLS.linkedin, label: "LinkedIn" },
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
          <RepoLink location="footer">Claudlobby</RepoLink>
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
