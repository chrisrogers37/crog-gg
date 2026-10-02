import { Link } from "react-router";
import { useContentStore, useLoad, useProjects } from "../../../store";
import type { Project } from "../../../types";
import { splitFeatured } from "../../../utils/featured";
import { LoadError } from "../../common/LoadError";
import { FeaturedProject } from "./FeaturedProject";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

/** How many projects the home page shows beside the featured one. */
const HOME_COUNT = 3;

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
 * own type, and the pills wrap as the real ones do.
 */
export function ProjectSkeleton({ count, featured }: { count: number; featured: boolean }) {
  return (
    <div className="projects-skeleton" role="status" aria-label="Loading projects">
      {featured && (
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
      )}
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

/**
 * The home page's projects: the featured one, the next few, and a link to
 * them all. A failure or an empty list says so here, and the rest of the
 * page stays up (#190 M23).
 */
export function Projects() {
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);

  if (load === "loading") return <ProjectSkeleton count={HOME_COUNT} featured />;
  if (typeof load === "object") {
    return (
      <LoadError
        compact
        message={`The projects didn't load: ${load.error}.`}
        onRetry={() => reloadProjects()}
      />
    );
  }
  if (projects.length === 0) return <p>No projects yet.</p>;

  const { featured, others } = splitFeatured(projects);
  return (
    <>
      {featured && <FeaturedProject project={featured} />}
      {others.length > 0 && <ProjectGrid projects={others.slice(0, HOME_COUNT)} />}
      <p className="page-links">
        <Link to="/projects">All projects</Link>
      </p>
    </>
  );
}
