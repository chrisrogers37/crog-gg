import { useState, useMemo } from "react";
import {
  useProjects,
  useIsLoading,
  useContentError,
  useContentStore,
} from "../../store";
import { ProjectCard } from "../../components/sections/Projects/ProjectCard";
import { SEO } from "../../components/SEO";
import "./ProjectsPage.css";

/**
 * ProjectsPage
 *
 * Displays all projects in a tile grid with filtering capabilities.
 * Each project tile links to its detail page.
 */
export function ProjectsPage() {
  const projects = useProjects();
  const isLoading = useIsLoading();
  const error = useContentError();
  const loadContent = useContentStore((s) => s.loadContent);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [projects]);

  // Filter projects based on search and category
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies?.some((tech) =>
          tech.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesCategory =
        selectedCategory === "all" || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  // Loading state
  if (isLoading && projects.length === 0) {
    return (
      <div className="projects-page">
        <header className="projects-header">
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">
            A collection of my work, side projects, and experiments.
          </p>
        </header>
        <div className="projects-loading">
          <div className="projects-loading__spinner" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="projects-page">
        <header className="projects-header">
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">
            A collection of my work, side projects, and experiments.
          </p>
        </header>
        <div className="projects-error" role="alert">
          <p className="projects-error__message">
            Failed to load projects. Please try again.
          </p>
          <button
            className="projects-error__retry"
            onClick={() => loadContent()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Projects"
        description="Explore my portfolio of software projects, side projects, and experiments. From web apps to mobile development."
        url="/projects"
      />
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
                  selectedCategory === category ? "active" : ""
                }`}
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                linkTo={`/projects/${project.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No projects match your search criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="clear-filters"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
