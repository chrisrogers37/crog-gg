import { Link } from "react-router";
import { useContentStore, useLoad, useProjects } from "../../../store";
import type { Project } from "../../../types";
import { splitFeatured } from "../../../utils/featured";
import { LoadError } from "../../common/LoadError";
import { FeaturedProject } from "./FeaturedProject";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

type ProjectGridProps = {
  projects: Project[];
  headingLevel?: 2 | 3;
};

/** The projects as a grid of cards. */
export function ProjectGrid({ projects, headingLevel }: ProjectGridProps) {
  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} headingLevel={headingLevel} />
      ))}
    </div>
  );
}

/**
 * Blank cards in the real ones' boxes while the projects load, so nothing
 * moves when they land (#246): each line is a blank line of the real card's
 * own type, and the pills wrap as the real ones do. The featured card's box
 * leads, since index.yaml usually names one.
 */
export function ProjectSkeleton({ count }: { count: number }) {
  return (
    <div className="projects-skeleton" role="status" aria-label="Loading projects">
      <div className="card project-featured skeleton-card" aria-hidden="true">
        <p className="page-eyebrow">&nbsp;</p>
        <div className="project-featured-title">&nbsp;</div>
        <p className="project-featured-description">
          &nbsp;
          <br />
          &nbsp;
        </p>
        <ul className="pills">
          {Array.from({ length: 6 }).map((_, j) => (
            <li key={j}>&nbsp;</li>
          ))}
        </ul>
        <div className="page-ctas">
          <span className="btn btn-ghost">&nbsp;</span>
        </div>
      </div>
      <div className="projects-grid" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card project-card skeleton-card">
            <span className="project-card-icon">&nbsp;</span>
            <div className="project-card-title">&nbsp;</div>
            <p className="project-card-description">
              &nbsp;
              <br />
              &nbsp;
            </p>
            <ul className="pills project-card-tech">
              {Array.from({ length: 4 }).map((_, j) => (
                <li key={j}>&nbsp;</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

type ProjectListProps = {
  /** How many beside the featured one, with a link to the rest; all if left out. */
  limit?: number;
  /** The titles' level: h2 under a page's h1, h3 under a section's h2. */
  headingLevel?: 2 | 3;
  /** A failure's message sized for a section rather than a page. */
  compact?: boolean;
};

/**
 * The projects index.yaml lists: the featured one first and larger, then the
 * others as cards, in the index's order. A failure or an empty list says so
 * in its place, and the rest of the page stays up (#190 M23).
 */
export function ProjectList({ limit, headingLevel = 3, compact = false }: ProjectListProps) {
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);

  if (projects.length > 0) {
    const { featured, others } = splitFeatured(projects);
    const shown = limit === undefined ? others : others.slice(0, limit);
    return (
      <>
        {featured && <FeaturedProject project={featured} headingLevel={headingLevel} />}
        {shown.length > 0 && <ProjectGrid projects={shown} headingLevel={headingLevel} />}
        {limit !== undefined && (
          <p className="page-links">
            <Link to="/projects">All projects</Link>
          </p>
        )}
      </>
    );
  }
  if (load === "loading") return <ProjectSkeleton count={limit ?? 6} />;
  if (typeof load === "object") {
    return (
      <LoadError
        compact={compact}
        message={`The projects didn't load: ${load.error}.`}
        onRetry={() => reloadProjects()}
      />
    );
  }
  return <p>No projects yet.</p>;
}
