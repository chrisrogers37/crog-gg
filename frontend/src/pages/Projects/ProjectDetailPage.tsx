import { useParams, Link, useLocation, useNavigate } from "react-router";
import {
  useProjects,
  useIsLoading,
  useContentError,
  useContentStore,
} from "../../store";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { LoadError } from "../../components/common/LoadError";
import { SEO } from "../../components/SEO";
import { projectBreadcrumbs, projectMeta } from "../../seo";
import {
  GitHubReadme,
  RepoStats,
  ProjectDemo,
} from "../../components/features";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { githubRepo, hasLiveDemo } from "../../utils/projectLinks";
import { useGithubOn } from "../../hooks";
import "./ProjectDetailPage.css";

function ProjectDetailSkeleton() {
  return (
    <div
      className="project-detail-page project-detail-page--placeholder project-detail-page--loading"
      role="status"
      aria-label="Loading project"
    >
      <div className="project-header project-detail-skeleton" aria-hidden="true">
        <div className="project-detail-skeleton__icon" />
        <div className="project-header-content">
          <div className="project-detail-skeleton__line project-detail-skeleton__line--title" />
          <div className="project-detail-skeleton__line" />
          <div className="project-detail-skeleton__line project-detail-skeleton__line--short" />
        </div>
      </div>
    </div>
  );
}

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
  const location = useLocation();
  const projects = useProjects();
  const isLoading = useIsLoading();
  const error = useContentError();
  const loadContent = useContentStore((s) => s.loadContent);

  // Find the project by slug (id)
  const project = projects.find((p) => p.id === slug);
  const repo = project ? githubRepo(project) : null;
  // Its stats and README show only where the API serves them (#189 M21).
  const githubOn = useGithubOn(repo?.owner);

  if (!project) {
    // A deep link renders before the content has loaded, and a failed load is
    // no evidence the project is missing. Only a loaded list without this
    // slug is "not found" (#196 M41).
    if (isLoading) return <ProjectDetailSkeleton />;
    if (error) {
      return (
        <div className="project-detail-page project-detail-page--placeholder">
          <LoadError
            message="Failed to load this project. Please try again."
            onRetry={() => loadContent()}
          />
        </div>
      );
    }
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

  const liveDemo = hasLiveDemo(project);

  return (
    <>
      <SEO {...projectMeta(project)} />
      {/* Keyed, so another project's page starts fresh rather than reusing
          this one's state, fetched figures included (#196 M68). */}
      <div className="project-detail-page" key={project.id}>
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
              {liveDemo && (
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
        {repo && githubOn && (
          <section className="project-section">
            <h2 className="section-title">Repository Stats</h2>
            <ErrorBoundary compact>
              <RepoStats owner={repo.owner} repoName={repo.name} />
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
        {liveDemo && (
          <section className="project-section">
            <ErrorBoundary compact>
              <ProjectDemo url={project.demo!} title={project.title} />
            </ErrorBoundary>
          </section>
        )}

        {/* GitHub README */}
        {repo && githubOn && (
          <section className="project-section">
            <h2 className="section-title">Documentation</h2>
            <ErrorBoundary compact>
              <GitHubReadme owner={repo.owner} repoName={repo.name} />
            </ErrorBoundary>
          </section>
        )}

        {/* Back Button */}
        <div className="project-footer">
          {/* Opened directly (a deep link, a new tab), there's no page of
              ours to go back to, and -1 would leave the site (#196 M67). */}
          <button
            onClick={() =>
              location.key === "default" ? navigate("/projects") : navigate(-1)
            }
            className="back-button"
          >
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
