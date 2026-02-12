import { Project } from "../../../types";
import "./Projects.css";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  experimental: "#F59E0B",
  archived: "#6B7280",
};

type ProjectCardProps = {
  project: Project;
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`project-card ${featured ? "project-card-featured" : ""}`}
    >
      <div
        className="project-card-image"
        style={{
          background:
            project.gradient ||
            "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
        }}
      >
        <i className={`${project.icon} project-card-icon`} />
      </div>

      <div className="project-card-body">
        <div className="project-card-header">
          <h4 className="project-card-title">{project.title}</h4>
          {project.status && (
            <span
              className="project-card-status"
              style={{
                color: STATUS_COLORS[project.status] || "#6B7280",
                borderColor: STATUS_COLORS[project.status] || "#6B7280",
              }}
            >
              {project.status}
            </span>
          )}
        </div>

        <p className="project-card-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <div className="project-card-tech">
            {project.technologies.map((tech, i) => (
              <span key={i} className="project-card-tech-pill">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
