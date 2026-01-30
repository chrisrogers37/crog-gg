import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../../store';
import { Project } from '../../types';
import './ProjectsPage.css';

/**
 * ProjectsPage
 *
 * Displays all projects in a grid with filtering capabilities.
 * Each project card links to its detail page.
 */
export function ProjectsPage() {
  const projects = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [projects]);

  // Filter projects based on search and category
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === '' ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies?.some((tech) =>
          tech.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <p className="projects-subtitle">
          A collection of my work, side projects, and experiments.
        </p>
      </header>

      {/* Filters */}
      <div className="projects-filters">
        <input
          type="search"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-button ${
                selectedCategory === category ? 'active' : ''
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <ProjectListCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No projects match your search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="clear-filters"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ProjectListCard
 *
 * Card component for the projects listing page.
 * Links to the project detail page.
 */
function ProjectListCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="project-list-card">
      <div className="card-icon">
        <i className={project.icon}></i>
      </div>

      <div className="card-content">
        <h2 className="card-title">{project.title}</h2>
        <p className="card-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <div className="card-technologies">
            {project.technologies.slice(0, 4).map((tech) => (
              <span key={tech} className="tech-tag">
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="tech-tag more">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-arrow">→</div>
    </Link>
  );
}
