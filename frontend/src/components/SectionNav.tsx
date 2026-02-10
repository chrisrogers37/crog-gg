import { useRef, useEffect, useCallback } from "react";

interface SectionNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "music", label: "Music" },
];

export default function SectionNav({
  activeSection,
  onSectionChange,
}: SectionNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const hasUserInteracted = useRef(false);

  // Handle scrolling when active section changes
  useEffect(() => {
    // Only scroll if user has interacted with navigation (not on initial load)
    if (activeSection && navRef.current && hasUserInteracted.current) {
      // Small delay to allow content to render
      setTimeout(() => {
        const navTop = navRef.current?.offsetTop ?? 0;
        window.scrollTo({
          top: navTop - 20,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [activeSection]);

  const handleClick = (
    sectionId: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    // Mark that user has interacted with navigation
    hasUserInteracted.current = true;

    // Scroll the clicked button into view within the nav
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });

    if (activeSection === sectionId) {
      // If the same section is clicked again, unselect it
      onSectionChange("");
    } else {
      onSectionChange(sectionId);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = sections.findIndex(
        (s) => s.id === document.activeElement?.getAttribute("data-section"),
      );
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % sections.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + sections.length) % sections.length;
      } else {
        return;
      }

      const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>(
        ".section-nav-button",
      );
      buttons?.[nextIndex]?.focus();
    },
    [],
  );

  return (
    <nav className="section-nav" ref={navRef} aria-label="Content sections">
      <div
        className="section-nav-container"
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            role="tab"
            aria-selected={activeSection === section.id}
            aria-pressed={activeSection === section.id}
            data-section={section.id}
            tabIndex={
              activeSection === section.id ||
              (!activeSection && section.id === sections[0].id)
                ? 0
                : -1
            }
            className={`section-nav-button ${activeSection === section.id ? "active" : ""}`}
            onClick={(e) => handleClick(section.id, e)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
