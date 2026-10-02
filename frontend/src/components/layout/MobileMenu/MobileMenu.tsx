import { useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, useIsMobileMenuOpen } from "../../../store";
import { ThemeToggle } from "../../common/ThemeToggle";
import site from "virtual:site-config";
import { socialsIn } from "../../../config/socials";
import { RepoLink } from "../../common/RepoLink";
import type { SectionMenu } from "./sectionMenu";
import "./MobileMenu.css";

// "about me", so it can't be mistaken for /about's own About section.
const PAGE_LINKS = [
  { to: "/", label: "home" },
  { to: "/about", label: "about me" },
  { to: "/projects", label: "all projects" },
];

// After the Claudlobby repo link, which is a RepoLink so its clicks count.
const CONNECT_LINKS = socialsIn(site, "menu");

/** The page's sections, when it has registered some (see sectionMenu.ts). */
type MobileMenuProps = Partial<SectionMenu>;

export function MobileMenu({
  sections,
  onSectionChange,
  activeSection,
}: MobileMenuProps) {
  const isOpen = useIsMobileMenuOpen();
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMobileMenu();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeMobileMenu]);

  const handleSectionClick = (sectionId: string) => {
    onSectionChange?.(sectionId);
    closeMobileMenu();
  };

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
          />

          {/* Menu panel */}
          <motion.nav
            className="mobile-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            aria-label="Mobile navigation"
          >
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">menu</span>
              <button
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                &#10005;
              </button>
            </div>

            <div className="mobile-menu-content">
              {/* Page links */}
              <div className="mobile-menu-section">
                {PAGE_LINKS.map((page) => (
                  <Link
                    key={page.to}
                    to={page.to}
                    className="mobile-menu-link"
                    onClick={handleLinkClick}
                  >
                    {page.label}
                  </Link>
                ))}
              </div>

              {/* Section links, from the page being viewed (see sectionMenu.ts) */}
              {sections && sections.length > 0 && (
                <div className="mobile-menu-section">
                  <span className="mobile-menu-section-label">sections</span>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      className={`mobile-menu-section-btn ${
                        activeSection === section.id ? "active" : ""
                      }`}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      {section.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="mobile-menu-section">
                <span className="mobile-menu-section-label">connect</span>
                <RepoLink
                  location="menu"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  claudlobby on github
                </RepoLink>
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
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
