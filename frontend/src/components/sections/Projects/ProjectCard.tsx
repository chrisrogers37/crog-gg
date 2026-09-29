import { Link } from "react-router-dom";
import { Project } from "../../../types";
import "./Projects.css";

type ProjectCardProps = {
  project: Project;
  linkTo?: string;
};

export function ProjectCard({ project, linkTo }: ProjectCardProps) {
  const content = (
    <>
      <div
        className="project-tile-header"
        style={{
          background:
            project.gradient ||
            "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
        }}
      >
        {project.icon && <span className="project-tile-icon">{project.icon}</span>}
      </div>
      <div className="project-tile-body">
        <h2 className="project-tile-title">{project.title}</h2>
        <p className="project-tile-description">{project.description}</p>
        {project.technologies && project.technologies.length > 0 && (
          <div className="project-tile-tech">
            {project.technologies.slice(0, 3).map((tech) => (
              <span key={tech} className="project-tile-tech-pill">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="project-tile-tech-pill project-tile-tech-more">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="project-tile">
        {content}
      </Link>
    );
  }

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-tile"
    >
      {content}
    </a>
  );
}
