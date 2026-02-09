import { useRef, useEffect } from "react";

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

  const handleClick = (sectionId: string) => {
    // Mark that user has interacted with navigation
    hasUserInteracted.current = true;

    if (activeSection === sectionId) {
      // If the same section is clicked again, unselect it
      onSectionChange("");
    } else {
      onSectionChange(sectionId);
    }
  };

  return (
    <nav className="section-nav" ref={navRef}>
      <div className="section-nav-container">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`section-nav-button ${activeSection === section.id ? "active" : ""}`}
            onClick={() => handleClick(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
