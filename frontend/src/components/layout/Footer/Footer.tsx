import { Link } from "react-router";
import site from "virtual:site-config";
import { socialsIn } from "../../../config/socials";
import { sourceUrl } from "../../../config/source";
import { RepoLink } from "../../common/RepoLink";
import "./Footer.css";

/**
 * Footer Component
 *
 * Copyright and links. The copyright line claims no rights over the code:
 * CONTENT-TERMS.md says what's reserved, and the code is MIT. "view source"
 * shows only when site.yaml names the repo (footer.source_repo_url, #188), so
 * a fork that leaves it empty shows no link.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const sourceRepoUrl = site.footer.source_repo_url;

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {currentYear} {site.owner.name}
        </p>
        <div className="footer-links">
          {site.home === "landing" && (
            <>
              <RepoLink location="footer">claudlobby</RepoLink>
              <Link to="/about">about</Link>
            </>
          )}
          {socialsIn(site, "footer").map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
          {sourceRepoUrl && (
            <a
              href={sourceUrl(sourceRepoUrl, __SITE_COMMIT__)}
              target="_blank"
              rel="noopener noreferrer"
            >
              view source
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
