import { useExperience, useIsRegenerating } from '../../../store';
import { ExperienceCard } from './ExperienceCard';
import './Experience.css';

/**
 * Experience Section
 *
 * Displays work experience as a list of job cards.
 * Data comes from the content store (loaded from experience.yaml).
 */
export function Experience() {
  const experience = useExperience();
  const isRegenerating = useIsRegenerating();

  if (!experience || experience.length === 0) {
    return (
      <section className="experience-section">
        <p className="empty-state">Loading experience...</p>
      </section>
    );
  }

  return (
    <section className="experience-section">
      {isRegenerating && (
        <div className="regenerating-overlay">
          <div className="spinner" />
          <p>Regenerating...</p>
        </div>
      )}

      <div className="employment-section">
        {experience.map((job, index) => (
          <ExperienceCard key={`${job.company}-${index}`} experience={job} />
        ))}
      </div>
    </section>
  );
}
