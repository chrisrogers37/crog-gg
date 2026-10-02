import { ProjectList } from "../../components/sections/Projects";
import { SEO } from "../../components/SEO";
import { PROJECTS_META } from "../../seo";

/**
 * ProjectsPage
 *
 * Every project index.yaml lists: the featured one first and larger, then the
 * rest as cards, in the index's order. Each card opens the project's page.
 * The page's shell, heading and head tags are the same in every state; only
 * the list switches, between its skeleton, its error and the projects.
 */
export function ProjectsPage() {
  return (
    <>
      <SEO {...PROJECTS_META} />
      <div className="page projects-page">
        <header className="page-hero">
          <p className="page-eyebrow">Projects</p>
          <h1 className="page-headline">things i've built.</h1>
        </header>
        <section aria-label="Projects">
          <ProjectList headingLevel={2} />
        </section>
      </div>
    </>
  );
}
