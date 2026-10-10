import { lazy, Suspense } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { useProjects, useLoad, useContentStore } from "../../store";
import type { Project } from "../../types";
import { Breadcrumbs } from "../../components/common/Breadcrumbs";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { LoadError } from "../../components/common/LoadError";
import { PageSection } from "../../components/common/PageSection";
import { SEO } from "../../components/SEO";
import { projectBreadcrumbs, projectMeta } from "../../seo";
import { ProjectDemo } from "../../components/features/ProjectDemo";
import { RepoStats } from "../../components/features/RepoStats";
import { hasOwnPage } from "../../content/ownPages";
import { PROJECT_PAGE_LOADING, PROJECT_PAGES } from "../../content/projectPages";
import { githubRepo, hasLiveDemo } from "../../utils/projectLinks";
import { useGithubOn, useScrollToHash } from "../../hooks";
import "./ProjectDetailPage.css";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

// react-markdown and highlight.js, in a chunk of their own: fetched only for
// a page that shows a README, not for Claudfather's, which has none.
const GitHubReadme = lazy(() =>
  import("../../components/features/GitHubReadme").then((m) => ({
    default: m.GitHubReadme,
  })),
);

/** The README's card while its chunk loads. */
function ReadmeFallback() {
  return (
    <div className="card readme-fallback" aria-hidden="true">
      <div className="page-skeleton page-skeleton--short" />
      <div className="page-skeleton" />
      <div className="page-skeleton" />
    </div>
  );
}

/**
 * The page's frame while the projects load (#196 M41). The breadcrumbs' row is held, so
 * the hero lands where its stand-in stood; a project with a page of its own
 * stands in its own hero (projectPages.ts).
 */
function ProjectDetailSkeleton({ slug }: { slug?: string }) {
  const OwnHero = slug !== undefined && hasOwnPage(slug) ? PROJECT_PAGE_LOADING[slug] : undefined;
  const lines = (
    <>
      <div className="page-skeleton page-skeleton--eyebrow" />
      <div className="page-skeleton page-skeleton--headline" />
      <div className="page-skeleton" />
      <div className="page-skeleton page-skeleton--short" />
    </>
  );
  return (
    <div
      className="page project-page project-page--loading"
      role="status"
      aria-label="Loading project"
    >
      <div className="breadcrumbs" aria-hidden="true">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">&nbsp;</li>
        </ol>
      </div>
      {OwnHero ? (
        <OwnHero>{lines}</OwnHero>
      ) : (
        <div className="page-hero" aria-hidden="true">
          {lines}
        </div>
      )}
    </div>
  );
}

/**
 * A project's page in the site's look (styles/page.css): what it is and where
 * to go, then its repo's figures, what it's built with, its live demo and its
 * README, each where it has one.
 */
function StandardProject({ project }: { project: Project }) {
  const repo = githubRepo(project);
  // Its stats and README show only where the API serves them (#189 M21).
  const githubOn = useGithubOn(repo?.owner);
  const liveDemo = hasLiveDemo(project);
  const eyebrow = [project.category, project.status].filter(Boolean).join(" · ");

  return (
    <>
      <header className="page-hero">
        <p className="page-eyebrow">
          <span aria-hidden="true">{project.icon}</span> {eyebrow}
        </p>
        <h1 className="page-headline">{project.title}</h1>
        <p className="page-sub">{project.description}</p>
        <div className="page-ctas">
          {project.url !== "#" && (
            <a href={project.url} className="btn btn-primary" {...EXTERNAL}>
              {project.url.includes("github.com") ? "view on GitHub" : "visit"}
            </a>
          )}
          {liveDemo && (
            <a href={project.demo} className="btn btn-ghost" {...EXTERNAL}>
              Live demo
            </a>
          )}
          {project.github && project.github !== project.url && (
            <a href={project.github} className="btn btn-ghost" {...EXTERNAL}>
              GitHub
            </a>
          )}
        </div>
      </header>

      {repo && githubOn && (
        <PageSection id="repository" heading="repository">
          <ErrorBoundary compact>
            <RepoStats owner={repo.owner} repoName={repo.name} />
          </ErrorBoundary>
        </PageSection>
      )}

      {project.technologies.length > 0 && (
        <PageSection id="built-with" heading="built with">
          <ul className="pills project-tech">
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </PageSection>
      )}

      {liveDemo && (
        <PageSection id="demo" heading="live demo">
          <ErrorBoundary compact>
            <ProjectDemo url={project.demo!} title={project.title} />
          </ErrorBoundary>
        </PageSection>
      )}

      {repo && githubOn && (
        <PageSection id="readme" heading="readme">
          <ErrorBoundary compact>
            <Suspense fallback={<ReadmeFallback />}>
              <GitHubReadme owner={repo.owner} repoName={repo.name} />
            </Suspense>
          </ErrorBoundary>
        </PageSection>
      )}
    </>
  );
}

/**
 * ProjectDetailPage: /projects/:slug. A project with a page of its own
 * (content/ownPages.ts) shows that; every other one the standard page.
 * The breadcrumbs and the way back are the site's either way.
 */
export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const projects = useProjects();
  const load = useLoad("projects");
  const reloadProjects = useContentStore((s) => s.reloadProjects);

  const project = projects.find((p) => p.id === slug);
  // A link to a section (/projects/claudfather#quickstart) lands on it once
  // the project is in.
  useScrollToHash(project !== undefined);

  if (!project) {
    // A deep link renders before the content has loaded, and a failed load is
    // no evidence the project is missing. Only a loaded list without this
    // slug is "not found" (#196 M41).
    if (load === "loading") return <ProjectDetailSkeleton slug={slug} />;
    if (typeof load === "object") {
      return (
        <div className="page project-page">
          <LoadError
            message={`the projects didn't load: ${load.error}.`}
            onRetry={() => reloadProjects()}
          />
        </div>
      );
    }
    return (
      <div className="page project-page">
        <header className="page-hero">
          <h1 className="page-headline">project not found</h1>
          <p className="page-sub">there's no project called "{slug}".</p>
          <div className="page-ctas">
            <Link to="/projects" className="btn btn-primary">
              all projects
            </Link>
          </div>
        </header>
      </div>
    );
  }

  const OwnPage = hasOwnPage(project.id) ? PROJECT_PAGES[project.id] : undefined;

  return (
    <>
      <SEO {...projectMeta(project)} />
      {/* Keyed, so another project's page starts fresh rather than reusing
          this one's state, fetched figures included (#196 M68). */}
      <div className="page project-page" key={project.id}>
        <Breadcrumbs items={projectBreadcrumbs(project)} />
        {OwnPage ? <OwnPage project={project} /> : <StandardProject project={project} />}

        <div className="page-links project-footer">
          {/* Opened directly (a deep link, a new tab), there's no page of
              ours to go back to, and -1 would leave the site (#196 M67). */}
          <button
            onClick={() =>
              location.key === "default" ? navigate("/projects") : navigate(-1)
            }
            className="btn btn-ghost"
          >
            go back
          </button>
          <Link to="/projects" className="btn btn-ghost">
            all projects
          </Link>
        </div>
      </div>
    </>
  );
}
