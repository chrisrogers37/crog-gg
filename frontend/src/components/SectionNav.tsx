import { useRef, useCallback, useEffect } from "react";
import { SECTIONS, SECTION_PANEL_ID, sectionTabId } from "./sectionTabs";

interface SectionNavProps {
  /** The highlighted tab: the open section, or About while it's previewed. */
  activeSection: string;
  /** A tab was clicked. The page decides what that opens or closes. */
  onSelect: (section: string) => void;
}

export default function SectionNav({ activeSection, onSelect }: SectionNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // Auto-scroll the active tab into view on narrow screens
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!navRef.current) return;

    const activeButton = navRef.current.querySelector<HTMLButtonElement>(
      `[data-section="${activeSection}"]`,
    );
    activeButton?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeSection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = SECTIONS.findIndex(
        (s) => s.id === document.activeElement?.getAttribute("data-section"),
      );
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % SECTIONS.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + SECTIONS.length) % SECTIONS.length;
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
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            role="tab"
            id={sectionTabId(section.id)}
            aria-controls={SECTION_PANEL_ID}
            aria-selected={activeSection === section.id}
            data-section={section.id}
            tabIndex={activeSection === section.id ? 0 : -1}
            className={`section-nav-button ${activeSection === section.id ? "active" : ""}`}
            onClick={() => onSelect(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
