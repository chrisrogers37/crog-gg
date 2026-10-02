import { useState, useMemo } from "react";
import { useProjects, useLoad, useContentStore } from "../../store";
import { LoadError } from "../../components/common/LoadError";
import { ProjectCard } from "../../components/sections/Projects/ProjectCard";
import { ProjectSkeletonGrid } from "../../components/sections/Projects/Projects";
import { SEO } from "../../components/SEO";
import { PROJECTS_META } from "../../seo";
import "./ProjectsPage.css";

/**
 * ProjectsPage
 *
 * Displays all projects in a tile grid with filtering capabilities.
 * Each project tile links to its detail page.
 */
export function ProjectsPage() {
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);
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

  // The page's shell, heading and head tags are the same in every state; only
  // the body switches: a skeleton while loading, an error naming the file if
  // that failed, and a line when there's nothing to show (#190 M23). The
  // filters stand above the skeleton too, so the grid doesn't drop when the
  // projects arrive.
  const status =
    projects.length > 0
      ? null
      : load === "loading"
        ? "loading"
        : typeof load === "object"
          ? "error"
          : "empty";

  return (
    <>
      <SEO {...PROJECTS_META} />
      <div className="projects-page">
        <header className="projects-header">
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">
            A collection of my work, side projects, and experiments.
          </p>
        </header>

        {(status === null || status === "loading") && (
          <div className="projects-filters">
            <input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={status === "loading"}
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
        )}

        {status === "loading" && <ProjectSkeletonGrid />}
        {typeof load === "object" && status === "error" && (
          <LoadError
            message={`The projects didn't load: ${load.error}.`}
            onRetry={() => reloadProjects()}
          />
        )}
        {status === "empty" && (
          <div className="no-results">
            <p>No projects yet.</p>
          </div>
        )}
        {status === null &&
          (filteredProjects.length > 0 ? (
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
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
          ))}
      </div>
    </>
  );
}
