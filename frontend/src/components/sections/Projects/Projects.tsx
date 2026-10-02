import { useContentStore, useLoad, useProjects } from "../../../store";
import { LoadError } from "../../common/LoadError";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

/**
 * Six blank tiles. Each line is a blank line of the real tile's own type, so a
 * tile keeps its height when the projects arrive: a title, a two-line
 * description, and three pills and a "+N", which wrap on a phone as the real
 * ones do.
 */
export function ProjectSkeletonGrid() {
  return (
    <div className="projects-grid" role="status" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="project-tile skeleton-tile" aria-hidden="true">
          <div className="project-tile-header skeleton-header" />
          <div className="project-tile-body">
            <div className="project-tile-title">&nbsp;</div>
            <div className="project-tile-description">
              &nbsp;
              <br />
              &nbsp;
            </div>
            <div className="project-tile-tech">
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="project-tile-tech-pill">
                  &nbsp;
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Projects() {
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);

  // A skeleton only while the projects load; a failure or an empty list
  // says so in this tab, and the rest of the page stays up (#190 M23).
  if (load !== "ready" || projects.length === 0) {
    return (
      <section className="projects-section">
        {load === "loading" ? (
          <ProjectSkeletonGrid />
        ) : typeof load === "object" ? (
          <LoadError
            compact
            message={`The projects didn't load: ${load.error}.`}
            onRetry={() => reloadProjects()}
          />
        ) : (
          <p>No projects yet.</p>
        )}
      </section>
    );
  }

  return (
    <section className="projects-section">
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
