import { Link } from "react-router-dom";
import { useProjects } from "../../../store";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

export function ProjectSkeletonGrid() {
  return (
    <div className="projects-grid" role="status" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="project-tile skeleton-tile" aria-hidden="true">
          <div className="project-tile-header skeleton-header" />
          <div className="project-tile-body">
            <div className="skeleton-line skeleton-title-line" />
            <div className="skeleton-line skeleton-desc-line-1" />
            <div className="skeleton-line skeleton-desc-line-2" />
            <div className="project-tile-tech">
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Projects() {
  const projects = useProjects();

  if (!projects || projects.length === 0) {
    return (
      <section className="projects-section">
        <ProjectSkeletonGrid />
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
      <p className="projects-all">
        <Link to="/projects">all projects</Link>
      </p>
    </section>
  );
}
