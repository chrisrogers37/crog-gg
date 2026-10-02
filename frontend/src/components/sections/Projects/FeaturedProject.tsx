import { Link } from "react-router";
import type { Project } from "../../../types";
import "./Projects.css";

type FeaturedProjectProps = {
  project: Project;
  /** The title's level: under the page's h1 (/projects), or a section's h2. */
  headingLevel?: 2 | 3;
};

/** The project index.yaml features: first, and larger than the rest. */
export function FeaturedProject({ project, headingLevel = 3 }: FeaturedProjectProps) {
  const Heading = `h${headingLevel}` as const;
  const titleId = `featured-${project.id}`;
  return (
    <article className="card project-featured" aria-labelledby={titleId}>
      <p className="page-eyebrow">Featured project</p>
      <Heading id={titleId} className="project-featured-title">
        <span aria-hidden="true">{project.icon}</span> {project.title}
      </Heading>
      <p className="project-featured-description">{project.description}</p>
      {project.technologies.length > 0 && (
        <ul className="pills" aria-label="Built with">
          {project.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      )}
      <div className="page-ctas">
        <Link to={`/projects/${project.id}`} className="btn btn-primary">
          View project
        </Link>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            GitHub
          </a>
        )}
      </div>
    </article>
  );
}
