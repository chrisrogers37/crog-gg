import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, useIsMobileMenuOpen } from "../../../store";
import { ThemeToggle } from "../../common/ThemeToggle";
import "./MobileMenu.css";

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
                <Link
                  to="/"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  home
                </Link>
                <Link
                  to="/projects"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  all projects
                </Link>
              </div>

              {/* Section links (only on homepage) */}
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
                <a
                  href="https://github.com/chrisrogers37"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  github
                </a>
                <a
                  href="https://linkedin.com/in/chrisrogers37"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  linkedin
                </a>
                <a
                  href="https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  spotify
                </a>
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
