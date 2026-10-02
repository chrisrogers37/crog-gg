import { Link } from "react-router";
import type { Project } from "../../../types";
import "./Projects.css";

type ProjectCardProps = {
  project: Project;
  /** The title's level: under the page's h1 (/projects), or a section's h2. */
  headingLevel?: 2 | 3;
};

/** How many of a project's technologies a card names; the rest are a count. */
const SHOWN_TECH = 3;

/** A project's card. It opens the project's page on the site (#196 M43). */
export function ProjectCard({ project, headingLevel = 3 }: ProjectCardProps) {
  const Heading = `h${headingLevel}` as const;
  const more = project.technologies.length - SHOWN_TECH;
  return (
    <Link to={`/projects/${project.id}`} className="card project-card">
      {/* The project's colour, from its file, behind its emoji. */}
      <span
        className="project-card-icon"
        aria-hidden="true"
        style={{ background: project.gradient }}
      >
        {project.icon}
      </span>
      <Heading className="project-card-title">{project.title}</Heading>
      {project.status && project.status !== "active" && (
        <span className="badge project-card-status">{project.status}</span>
      )}
      <p className="project-card-description">{project.description}</p>
      {project.technologies.length > 0 && (
        <ul className="pills project-card-tech" aria-label="Built with">
          {project.technologies.slice(0, SHOWN_TECH).map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
          {more > 0 && <li>+{more}</li>}
        </ul>
      )}
    </Link>
  );
}
