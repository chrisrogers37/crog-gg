import { Employment } from "../../../types";

interface ExperienceCardProps {
  experience: Employment;
}

/**
 * ExperienceCard
 *
 * Displays a single job experience entry with title, company,
 * period, and list of achievements.
 */
export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article className="job-card">
      <header className="job-header">
        <div className="job-title-section">
          <h4>{experience.title}</h4>
        </div>
        <div className="company">{experience.company}</div>
        <div className="period">{experience.period}</div>
      </header>

      {experience.achievements && experience.achievements.length > 0 && (
        <ul className="achievements">
          {experience.achievements.map((achievement, index) => (
            <li key={index}>{achievement}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
