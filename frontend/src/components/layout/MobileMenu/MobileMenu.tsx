import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, useIsMobileMenuOpen } from "../../../store";
import { ThemeToggle } from "../../common/ThemeToggle";
import { CLAUDLOBBY_REPO } from "../../../content/links";
import "./MobileMenu.css";

// "about me", so it can't be mistaken for /about's own About section.
const PAGE_LINKS = [
  { to: "/", label: "home" },
  { to: "/about", label: "about me" },
  { to: "/projects", label: "all projects" },
];

const CONNECT_LINKS = [
  { href: CLAUDLOBBY_REPO, label: "claudlobby on github" },
  { href: "https://github.com/chrisrogers37", label: "github" },
  { href: "https://linkedin.com/in/chrisrogers37", label: "linkedin" },
  {
    href: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
    label: "spotify",
  },
];

type MobileMenuProps = {
  sections?: { id: string; label: string }[];
  onSectionChange?: (section: string) => void;
  activeSection?: string;
};

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
                {CONNECT_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
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
