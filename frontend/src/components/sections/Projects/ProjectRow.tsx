import { Link } from "react-router";
import type { Project } from "../../../types";
import "./Projects.css";

type ProjectRowProps = {
  project: Project;
  /** The title's level: under the page's h1 (/projects), or a section's h2. */
  headingLevel?: 2 | 3;
};

/**
 * A project as a row of the list (Chris, 2026-10-03: the cards read as
 * generated): its name, which opens its page on the site (#196 M43), its
 * whole description, and what it's built with. The whole row takes the click,
 * but the link is named by the project alone.
 */
export function ProjectRow({ project, headingLevel = 3 }: ProjectRowProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <li className="project-row">
      <div className="project-row-head">
        <Heading className="project-row-title">
          <Link to={`/projects/${project.id}`} className="project-row-link">
            {project.title}
          </Link>
        </Heading>
        {project.status && project.status !== "active" && (
          <span className="badge project-row-status">{project.status}</span>
        )}
      </div>
      <div className="project-row-body">
        <p className="project-row-description">{project.description}</p>
        {project.technologies.length > 0 && (
          <p className="project-row-tech">
            <span className="sr-only">built with </span>
            {project.technologies.join(" · ")}
          </p>
        )}
      </div>
    </li>
  );
}
