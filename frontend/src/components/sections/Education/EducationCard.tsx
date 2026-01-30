import { Education as EducationType } from '../../../types';

interface EducationCardProps {
  education: EducationType;
}

/**
 * EducationCard
 *
 * Displays a single education entry with school, degree, and year.
 */
export function EducationCard({ education }: EducationCardProps) {
  return (
    <article className="education-card">
      <h4>{education.school}</h4>
      <div className="degree">{education.degree}</div>
      <div className="year">{education.year}</div>
    </article>
  );
}
