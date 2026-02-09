import { useEducation, useIsRegenerating } from "../../../store";
import { EducationCard } from "./EducationCard";
import "./Education.css";

/**
 * Education Section
 *
 * Displays educational background as a grid of cards.
 * Data comes from the content store (loaded from education.yaml).
 */
export function Education() {
  const education = useEducation();
  const isRegenerating = useIsRegenerating();

  if (!education || education.length === 0) {
    return (
      <section className="education-section">
        <p className="empty-state">Loading education...</p>
      </section>
    );
  }

  return (
    <section className="education-section">
      {isRegenerating && (
        <div className="regenerating-overlay">
          <div className="spinner" />
          <p>Regenerating...</p>
        </div>
      )}

      <div className="education-grid">
        {education.map((edu, index) => (
          <EducationCard key={`${edu.school}-${index}`} education={edu} />
        ))}
      </div>
    </section>
  );
}
