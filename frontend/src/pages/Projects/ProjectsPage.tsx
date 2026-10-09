import site from "virtual:site-config";
import { ProjectList } from "../../components/sections/Projects";
import { SEO } from "../../components/SEO";
import { PROJECTS_META } from "../../seo";

/** Where the rest of the owner's work is: site.yaml's GitHub link, if it has one. */
const github = site.socials.find((social) => social.icon === "github");

/**
 * ProjectsPage
 *
 * Every project index.yaml lists: the featured one first and larger, then the
 * rest as rows, in the index's order, and a link to the rest on GitHub. Each
 * opens the project's page. The page's shell, heading and head tags are the
 * same in every state; only the list switches, between its skeleton, its
 * error and the projects.
 */
export function ProjectsPage() {
  return (
    <>
      <SEO {...PROJECTS_META} />
      <div className="page projects-page">
        <header className="page-hero">
          <p className="page-eyebrow">{site.page_copy.projects.eyebrow}</p>
          <h1 className="page-headline">{site.page_copy.projects.heading}</h1>
        </header>
        <section aria-label="Projects">
          <ProjectList headingLevel={2} />
          {github && (
            <p className="page-links">
              <a href={github.url} target="_blank" rel="noopener noreferrer">
                {site.page_copy.projects.github_link}
              </a>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
