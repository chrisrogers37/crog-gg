import { Link } from "react-router";
import { useUIStore, useIsMobileMenuOpen } from "../../../store";
import { useModalDialog } from "../../../hooks/useModalDialog";
import { ThemeToggle } from "../../common/ThemeToggle";
import site from "virtual:site-config";
import { SITE_PAGES } from "../../../config/pages";
import { socialsIn } from "../../../config/socials";
import type { SectionMenu } from "./sectionMenu";
import "./MobileMenu.css";

const CONNECT_LINKS = socialsIn(site, "menu");

/** The page's sections, when it has registered some (see sectionMenu.ts). */
type MobileMenuProps = Partial<SectionMenu>;

export function MobileMenu({ sections }: MobileMenuProps) {
  const isOpen = useIsMobileMenuOpen();
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const dialogRef = useModalDialog(isOpen);

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <dialog
      ref={dialogRef}
      id="mobile-navigation"
      className="mobile-menu"
      aria-label="Mobile navigation"
      onCancel={(event) => {
        event.preventDefault();
        closeMobileMenu();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
          if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
            closeMobileMenu();
          }
        }
      }}
    >
      <nav aria-label="Mobile navigation">
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">menu</span>
          <button
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            data-modal-focus
          >
            &#10005;
          </button>
        </div>

        <div className="mobile-menu-content">
          {/* Page links */}
          <div className="mobile-menu-section">
            {SITE_PAGES.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="mobile-menu-link"
                onClick={handleLinkClick}
              >
                {page.label.toLowerCase()}
              </Link>
            ))}
          </div>

          {/* Section links, from the page being viewed (see sectionMenu.ts).
              A group its label names: "about" and "projects" are pages too. */}
          {sections && sections.length > 0 && (
            <div
              className="mobile-menu-section"
              role="group"
              aria-labelledby="mobile-menu-sections"
            >
              <span id="mobile-menu-sections" className="mobile-menu-section-label">
                sections
              </span>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  {section.label.toLowerCase()}
                </a>
              ))}
            </div>
          )}

          {/* Social links */}
          <div className="mobile-menu-section">
            <span className="mobile-menu-section-label">connect</span>
            {CONNECT_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-menu-link"
                onClick={handleLinkClick}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Theme toggle */}
          <div className="mobile-menu-section mobile-menu-theme">
            <span className="mobile-menu-section-label">theme</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </dialog>
  );
}
