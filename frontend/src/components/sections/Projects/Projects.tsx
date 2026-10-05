import { Link } from "react-router";
import { useContentStore, useLoad, useProjects } from "../../../store";
import type { Project } from "../../../types";
import { splitFeatured } from "../../../utils/featured";
import { LoadError } from "../../common/LoadError";
import { FeaturedProject } from "./FeaturedProject";
import { ProjectRow } from "./ProjectRow";
import "./Projects.css";

type ProjectRowsProps = {
  projects: Project[];
  headingLevel?: 2 | 3;
};

/** The projects after the featured one, as a list of compact cards. */
export function ProjectRows({ projects, headingLevel }: ProjectRowsProps) {
  return (
    // role="list": Safari drops list semantics under list-style: none.
    <ul className="project-rows" role="list">
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} headingLevel={headingLevel} />
      ))}
    </ul>
  );
}

/**
 * Blank stand-ins in the real ones' boxes while the projects load, so little
 * moves when they land (#246): each line is a blank line of the real one's
 * own type. The featured card's box leads, since index.yaml usually names
 * one; a card stands in with a description of two lines, the usual length.
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
      <ul className="project-rows" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="card project-row skeleton-row">
            <div className="project-row-head">
              <div className="project-row-title">&nbsp;</div>
            </div>
            <div className="project-row-body">
              <p className="project-row-description">
                &nbsp;
                <br />
                &nbsp;
              </p>
              <p className="project-row-tech">&nbsp;</p>
            </div>
          </li>
        ))}
      </ul>
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
 * others as compact cards, in the index's order. A failure or an empty list says so
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
        {shown.length > 0 && <ProjectRows projects={shown} headingLevel={headingLevel} />}
        {limit !== undefined && (
          <p className="page-links">
            <Link to="/projects">all projects</Link>
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
        message={`the projects didn't load: ${load.error}.`}
        onRetry={() => reloadProjects()}
      />
    );
  }
  return <p>no projects yet.</p>;
}
