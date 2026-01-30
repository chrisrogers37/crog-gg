import { Project } from '../../../types';

interface ProjectCardProps {
  project: Project;
  isGitHubLink?: boolean;
}

/**
 * ProjectCard
 *
 * Displays a single project with title, description, and link.
 */
export function ProjectCard({ project, isGitHubLink }: ProjectCardProps) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`portfolio-link ${isGitHubLink ? 'github-link' : ''}`}
    >
      <i className={project.icon}></i>
      <div>
        <span className="link-title">{project.title}</span>
        <span className="link-description">{project.description}</span>
        {project.technologies && project.technologies.length > 0 && (
          <div className="project-technologies">
            {project.technologies.map((tech, index) => (
              <span key={index} className="tech-tag">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
