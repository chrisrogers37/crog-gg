import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjects } from "../../store";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { SEO } from "../../components/SEO";
import { projectBreadcrumbs, projectMeta } from "../../seo/site";
import {
  GitHubReadme,
  RepoStats,
  ProjectDemo,
} from "../../components/features";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import "./ProjectDetailPage.css";

/**
 * ProjectDetailPage (Enhanced with GitHub Integration)
 *
 * Displays detailed information about a single project including:
 * - GitHub README rendering
 * - Repository statistics
 * - Live demo embedding (if applicable)
 */
export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const projects = useProjects();

  // Find the project by slug (id)
  const project = projects.find((p) => p.id === slug);

  // Handle project not found
  if (!project) {
    return (
      <div className="project-not-found">
        <h1>Project Not Found</h1>
        <p>The project "{slug}" could not be found.</p>
        <Link to="/projects" className="back-link">
          Back to Projects
        </Link>
      </div>
    );
  }

  // Extract GitHub repo name. Prefer the explicit `github` field; fall back to
  // `url` for entries whose primary link is the repo itself. Reading only `url`
  // meant a declared `github` was silently ignored, so any project pointing at a
  // live app got no repo stats and no docs.
  const githubSource = project.github || project.url;
  const githubRepoMatch = githubSource?.match(/github\.com\/[\w-]+\/([\w-]+)/);
  const githubRepoName = githubRepoMatch ? githubRepoMatch[1] : null;

  // A demo only earns its own button when it goes somewhere `url` doesn't.
  const hasLiveDemo =
    project.demo &&
    !project.demo.includes("github.com") &&
    project.demo.replace(/\/$/, "") !== project.url?.replace(/\/$/, "");

  return (
    <>
      <SEO {...projectMeta(project)} />
      <div className="project-detail-page">
        {/* Breadcrumbs */}
        <Breadcrumbs items={projectBreadcrumbs(project)} />

        {/* Project Header */}
        <header className="project-header">
          <div className="project-icon-large">{project.icon || "📁"}</div>
          <div className="project-header-content">
            <h1 className="project-title">{project.title}</h1>
            <p className="project-description">{project.description}</p>

            {/* Status Badge */}
            {project.status && (
              <span
                className={`status-badge status-${project.status.toLowerCase()}`}
              >
                {project.status}
              </span>
            )}

            {/* Links */}
            <div className="project-links">
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link primary"
                >
                  {project.url.includes("github.com")
                    ? "View on GitHub"
                    : "View Project"}
                </a>
              )}
              {hasLiveDemo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link secondary"
                >
                  Live Demo
                </a>
              )}
            </div>
          </div>
        </header>

        {/* GitHub Stats */}
        {githubRepoName && (
          <section className="project-section">
            <h2 className="section-title">Repository Stats</h2>
            <ErrorBoundary compact>
              <RepoStats repoName={githubRepoName} />
            </ErrorBoundary>
          </section>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <section className="project-section">
            <h2 className="section-title">Technologies</h2>
            <div className="technologies-list">
              {project.technologies.map((tech) => (
                <span key={tech} className="technology-badge">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Live Demo */}
        {hasLiveDemo && (
          <section className="project-section">
            <ErrorBoundary compact>
              <ProjectDemo url={project.demo!} title={project.title} />
            </ErrorBoundary>
          </section>
        )}

        {/* GitHub README */}
        {githubRepoName && (
          <section className="project-section">
            <h2 className="section-title">Documentation</h2>
            <ErrorBoundary compact>
              <GitHubReadme repoName={githubRepoName} />
            </ErrorBoundary>
          </section>
        )}

        {/* Back Button */}
        <div className="project-footer">
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
          <Link to="/projects" className="all-projects-link">
            View All Projects
          </Link>
        </div>
      </div>
    </>
  );
}
