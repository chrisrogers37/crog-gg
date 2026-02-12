import { useState, useEffect } from "react";
import { useProjects } from "../../../store";
import { ProjectCard } from "./ProjectCard";
import { GitHubStats } from "./GitHubStats";
import "./Projects.css";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Language {
  name: string;
  bytes: number;
}

export function Projects() {
  const projects = useProjects();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLanguages(true);
      setLanguageError(null);
      try {
        const response = await fetch(`${API_URL}/api/github/languages`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch languages");
        }
        const data = await response.json();
        const formattedLanguages = data.languages.map(
          ([name, bytes]: [string, number]) => ({
            name,
            bytes,
          }),
        );
        setLanguages(formattedLanguages);
      } catch (err) {
        if (err instanceof Error) {
          setLanguageError(err.message);
        } else {
          setLanguageError("An unknown error occurred");
        }
      } finally {
        setLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  if (!projects || projects.length === 0) {
    return (
      <section className="projects-section">
        <p className="empty-state">Loading projects...</p>
      </section>
    );
  }

  const featuredProjects = projects
    .filter((p) => p.featured && p.id !== "github")
    .sort((a, b) => a.order - b.order);

  const otherProjects = projects
    .filter((p) => !p.featured && p.id !== "github")
    .sort((a, b) => a.order - b.order);

  const githubProject = projects.find((p) => p.id === "github");

  return (
    <section className="projects-section">
      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <div className="projects-grid">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} featured />
          ))}
        </div>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <>
          <h4 className="projects-other-heading">other projects</h4>
          <div className="projects-grid">
            {otherProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}

      {/* GitHub link */}
      {githubProject && (
        <div className="github-project-section">
          <ProjectCard project={githubProject} />
        </div>
      )}

      {/* GitHub Language Statistics */}
      <GitHubStats
        languages={languages}
        isLoading={loadingLanguages}
        error={languageError}
      />
    </section>
  );
}
