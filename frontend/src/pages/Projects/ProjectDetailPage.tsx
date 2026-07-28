import { useParams, Link, useNavigate } from "react-router";
import { useProjects } from "../../store";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { SEO, SoftwareSchema, BreadcrumbSchema } from "../../components/SEO";
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

  // Extract GitHub repo name from URL
  const githubRepoMatch = project.url?.match(/github\.com\/[\w-]+\/([\w-]+)/);
  const githubRepoName = githubRepoMatch ? githubRepoMatch[1] : null;

  // Check if project has a live demo URL
  const hasLiveDemo = project.demo && !project.demo.includes("github.com");

  return (
    <>
      <SEO
        title={project.title}
        description={project.description}
        url={`/projects/${project.id}`}
      />
      <SoftwareSchema
        name={project.title}
        description={project.description}
        url={project.url}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://crog.gg/" },
          { name: "Projects", url: "https://crog.gg/projects" },
          {
            name: project.title,
            url: `https://crog.gg/projects/${project.id}`,
          },
        ]}
      />
      <div className="project-detail-page">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "Projects", path: "/projects" },
            { label: project.title },
          ]}
        />

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
              {project.demo && (
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
