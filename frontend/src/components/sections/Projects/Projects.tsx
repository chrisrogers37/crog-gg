import { useState, useEffect } from 'react';
import { useProjects } from '../../../store';
import { ProjectCard } from './ProjectCard';
import { GitHubStats } from './GitHubStats';
import './Projects.css';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Language {
  name: string;
  bytes: number;
}

/**
 * Projects Section
 *
 * Displays project cards and GitHub language statistics.
 * GitHub stats are fetched lazily when the section is shown.
 */
export function Projects() {
  const projects = useProjects();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  // Fetch GitHub stats when component mounts
  useEffect(() => {
    const fetchLanguages = async () => {
      setLoadingLanguages(true);
      setLanguageError(null);
      try {
        const response = await fetch(`${API_URL}/api/github/languages`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch languages');
        }
        const data = await response.json();
        const formattedLanguages = data.languages.map(([name, bytes]: [string, number]) => ({
          name,
          bytes,
        }));
        setLanguages(formattedLanguages);
      } catch (err) {
        if (err instanceof Error) {
          setLanguageError(err.message);
        } else {
          setLanguageError('An unknown error occurred');
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

  // Separate GitHub project from others
  const mainProjects = projects.filter((p) => p.id !== 'github');
  const githubProject = projects.find((p) => p.id === 'github');

  return (
    <section className="projects-section">
      {/* Main Projects Grid */}
      <div className="links-grid">
        {mainProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* GitHub Project - Separate Section */}
      {githubProject && (
        <div className="github-project-section">
          <div className="github-project-card">
            <ProjectCard project={githubProject} isGitHubLink />
          </div>
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
