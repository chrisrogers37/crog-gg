import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../../store';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import './ProjectDetailPage.css';

/**
 * ProjectDetailPage
 *
 * Displays detailed information about a single project.
 * The slug parameter maps to project.id from the YAML data.
 *
 * In Phase 6, this will also display the GitHub README.
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
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', path: '/' },
          { label: 'Projects', path: '/projects' },
          { label: project.title },
        ]}
      />

      {/* Project Header */}
      <header className="project-header">
        <div className="project-icon-large">
          <i className={project.icon}></i>
        </div>
        <div className="project-header-content">
          <h1 className="project-title">{project.title}</h1>
          <p className="project-description">{project.description}</p>

          {/* Status Badge */}
          {project.status && (
            <span className={`status-badge status-${project.status.toLowerCase()}`}>
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
                {project.url.includes('github.com')
                  ? 'View on GitHub'
                  : 'View Project'}
              </a>
            )}
          </div>
        </div>
      </header>

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

      {/* README Placeholder - Will be implemented in Phase 6 */}
      <section className="project-section readme-section">
        <h2 className="section-title">About This Project</h2>
        <div className="readme-placeholder">
          <p>
            Project README will be loaded from GitHub in a future update.
          </p>
          {project.url && (
            <p>
              For now, visit the{' '}
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                project repository
              </a>{' '}
              to learn more.
            </p>
          )}
        </div>
      </section>

      {/* Back Button */}
      <div className="project-footer">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Go Back
        </button>
        <Link to="/projects" className="all-projects-link">
          View All Projects
        </Link>
      </div>
    </div>
  );
}
