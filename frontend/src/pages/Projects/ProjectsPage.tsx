import { useProjects, useLoad, useContentStore } from "../../store";
import { LoadError } from "../../components/common/LoadError";
import {
  FeaturedProject,
  ProjectGrid,
  ProjectSkeleton,
} from "../../components/sections/Projects";
import { splitFeatured } from "../../utils/featured";
import { SEO } from "../../components/SEO";
import { PROJECTS_META } from "../../seo";

/**
 * ProjectsPage
 *
 * Every project index.yaml lists: the featured one first and larger, then the
 * rest as cards, in the index's order. Each card opens the project's page.
 */
export function ProjectsPage() {
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);
  const { featured, others } = splitFeatured(projects);

  // The page's shell, heading and head tags are the same in every state; only
  // the body switches: a skeleton while loading, an error naming the file if
  // that failed, and a line when there's nothing to show (#190 M23).
  return (
    <>
      <SEO {...PROJECTS_META} />
      <div className="page projects-page">
        <header className="page-hero">
          <p className="page-eyebrow">Projects</p>
          <h1 className="page-headline">things i've built.</h1>
        </header>

        {projects.length > 0 ? (
          <section aria-label="Projects">
            {featured && <FeaturedProject project={featured} headingLevel={2} />}
            {others.length > 0 && <ProjectGrid projects={others} headingLevel={2} />}
          </section>
        ) : load === "loading" ? (
          <ProjectSkeleton count={6} featured />
        ) : typeof load === "object" ? (
          <LoadError
            message={`The projects didn't load: ${load.error}.`}
            onRetry={() => reloadProjects()}
          />
        ) : (
          <p>No projects yet.</p>
        )}
      </div>
    </>
  );
}
