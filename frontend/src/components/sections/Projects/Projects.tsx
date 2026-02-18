import { useProjects } from "../../../store";
import { ProjectCard } from "./ProjectCard";
import "./Projects.css";

export function Projects() {
  const projects = useProjects();

  if (!projects || projects.length === 0) {
    return null;
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
