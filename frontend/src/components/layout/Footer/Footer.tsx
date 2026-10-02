import { Link } from "react-router";
import { PROFILE_URLS } from "../../../content/links";
import { RepoLink } from "../../common/RepoLink";
import "./Footer.css";

// Lowercase, like the mobile menu's.
const PROFILE_LINKS = [
  { href: PROFILE_URLS.github, label: "github" },
  { href: PROFILE_URLS.linkedin, label: "linkedin" },
];

/**
 * Footer Component
 *
 * Copyright and links. The copyright line claims no rights over the code:
 * CONTENT-TERMS.md says what's reserved, and the code is MIT. "view source"
 * shows only when the build names the repo (VITE_SOURCE_REPO_URL, #188), so a
 * fork that leaves it unset shows no link.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const sourceRepoUrl = import.meta.env.VITE_SOURCE_REPO_URL?.trim();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {currentYear} Chris Rogers
        </p>
        <div className="footer-links">
          <RepoLink location="footer">claudlobby</RepoLink>
          <Link to="/about">about</Link>
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
          {sourceRepoUrl && (
            <a href={sourceRepoUrl} target="_blank" rel="noopener noreferrer">
              view source
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
