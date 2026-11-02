import { Link } from "react-router";
import type { Project } from "../../../types";
import { RepoLink } from "../../common/RepoLink";
import { ProjectMark } from "../../common/ProjectMark";
import { projectBrandStyle, projectLabels } from "../../../content/projectPresentation";
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
    <article className="card project-featured" aria-labelledby={titleId} data-brand={project.brand} style={projectBrandStyle(project.brand)}>
      <div className="project-featured-copy">
        <p className="page-eyebrow">{projectLabels.featured}</p>
        <Heading id={titleId} className="project-featured-title">
          {project.title}
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
            {projectLabels.view}
          </Link>
          {project.github && (
            // Counted when it's Claudlobby's repo, as its page's links are (#177).
            <RepoLink location="featured" href={project.github} className="btn btn-ghost">
              GitHub
            </RepoLink>
          )}
        </div>
      </div>
      <ProjectMark brand={project.brand} icon={project.icon} title={project.title} />
    </article>
  );
}
