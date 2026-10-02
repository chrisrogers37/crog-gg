import type { SiteConfig } from "../config/schema";
import { socialsIn } from "../config/socials";
import type { Project } from "../types/Project";
import { CLAUDLOBBY_REPO } from "../content/links";

/**
 * What each page tells crawlers and link unfurlers about itself (#174).
 *
 * Two writers read this and nothing else: the build (scripts/vite-prerender.ts)
 * puts each route's tags in that route's own HTML, because social crawlers
 * (X, LinkedIn, Slack, iMessage, Discord) never run JavaScript; and the SEO
 * component renders the same tags through react-helmet-async once React
 * mounts.
 *
 * The prerendered tags carry data-rh="true", react-helmet-async's own marker.
 * On its first commit Helmet keeps each marked tag that is identical to one it
 * renders and removes the rest, so the page ends up with one set of tags, not
 * two. That only holds while both writers build their tags here; SEO.test.tsx
 * pins it.
 *
 * Everything that names the owner or the site comes from site/site.yaml
 * (#188): the app gets it through seo/index.ts, the build through
 * siteConfig() in scripts/site-config.ts. This file must not import
 * `virtual:site-config` itself, because vite.config.ts imports it.
 */

export type PageMeta = {
  /**
   * Site-relative path: the canonical URL and og:url. A page that must not be
   * indexed has none.
   */
  path?: string;
  /** Page title; the site name is appended. */
  title: string;
  description: string;
  type?: "website" | "profile";
  noIndex?: boolean;
  /** JSON-LD objects describing the page. */
  schemas?: object[];
};

/** A page a visitor can land on, so it has a URL. */
export type LandingPage = PageMeta & { path: string };

type HeadTag = { tag: "meta" | "link"; attrs: Record<string, string> };

const named = (name: string, content: string): HeadTag => ({
  tag: "meta",
  attrs: { name, content },
});

const property = (property: string, content: string): HeadTag => ({
  tag: "meta",
  attrs: { property, content },
});

/**
 * A JSON-LD object serialized for a <script> body. `<` is escaped so that no
 * string inside the schema can close the script it is written into; `<`
 * is still `<` to any JSON parser.
 */
export const jsonLd = (schema: object) =>
  JSON.stringify(schema).replace(/</g, "\\u003c");

export type ProjectSummary = Pick<Project, "id" | "title" | "description" | "url">;

/** The trail ProjectDetailPage shows, and the BreadcrumbList describing it. */
export const projectBreadcrumbs = (project: ProjectSummary) => [
  { label: "Home", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: project.title, path: `/projects/${project.id}` },
];


/**
 * The site's head builders and page metadata, for one site.yaml. Key order is
 * the order the tags and JSON-LD are written in, so keep it when editing.
 */
export function createSeo(site: SiteConfig) {
  /** The canonical origin; every absolute self-URL is built from it (#178). */
  const SITE_URL = site.site.url;
  const OG_IMAGE = site.seo.image;

  const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

  const pageTitle = (meta: PageMeta) => `${meta.title} | ${site.seo.site_name}`;

  /**
   * The page's meta and link tags, in the order they are written. The title
   * and JSON-LD are rendered separately: Helmet manages the title through
   * document.title, and JSON-LD goes through jsonLd().
   */
  function headTags(meta: PageMeta): HeadTag[] {
    const title = pageTitle(meta);
    const image = absoluteUrl(OG_IMAGE.path);
    const canonical = meta.path ? absoluteUrl(meta.path) : undefined;

    return [
      named("description", meta.description),
      ...(meta.noIndex ? [named("robots", "noindex, nofollow")] : []),
      ...(canonical
        ? [{ tag: "link" as const, attrs: { rel: "canonical", href: canonical } }]
        : []),
      property("og:title", title),
      property("og:description", meta.description),
      property("og:image", image),
      property("og:image:width", String(OG_IMAGE.width)),
      property("og:image:height", String(OG_IMAGE.height)),
      property("og:image:alt", OG_IMAGE.alt),
      property("og:type", meta.type ?? "website"),
      property("og:site_name", site.seo.site_name),
      ...(canonical ? [property("og:url", canonical)] : []),
      named("twitter:card", "summary_large_image"),
      named("twitter:title", title),
      named("twitter:description", meta.description),
      named("twitter:image", image),
      named("twitter:image:alt", OG_IMAGE.alt),
    ];
  }

  const AUTHOR = {
    "@type": "Person",
    name: site.owner.name,
    url: SITE_URL,
  } as const;

  const HOME_DESCRIPTION = `Claudlobby composes a fleet of always-on Claude Code agents from one fleet.yaml, on hardware you own: an open-source dark factory for software. By ${site.owner.name}.`;

  /** The front door for Claudlobby (#173). */
  const HOME_META: LandingPage = {
    path: "/",
    title: "Claudlobby",
    description: HOME_DESCRIPTION,
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        name: "Claudlobby",
        description: HOME_DESCRIPTION,
        codeRepository: CLAUDLOBBY_REPO,
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        programmingLanguage: "Python",
        runtimePlatform: "Claude Code",
        author: AUTHOR,
      },
    ],
  };

  const { works_for: worksFor } = site.owner;

  /** The personal page, which is who the Person schema describes. */
  const ABOUT_META: LandingPage = {
    path: "/about",
    title: "About",
    description: site.seo.about.description,
    type: "profile",
    schemas: [
      {
        "@context": "https://schema.org",
        ...AUTHOR,
        image: absoluteUrl(site.owner.image),
        jobTitle: site.owner.job_title,
        ...(worksFor && {
          worksFor: {
            "@type": "Organization",
            name: worksFor.name,
            url: worksFor.url,
          },
        }),
        sameAs: socialsIn(site, "schema").map((entry) => entry.url),
        knowsAbout: site.owner.knows_about,
      },
    ],
  };

  const PROJECTS_META: LandingPage = {
    path: "/projects",
    title: "Projects",
    description: site.seo.projects.description,
  };

  const NOT_FOUND_META: PageMeta = {
    title: "Page not found",
    description: `This page doesn't exist. Head back to ${new URL(SITE_URL).host.replace(/^www\./, "")} to find your way.`,
    noIndex: true,
  };

  function projectMeta(project: ProjectSummary): LandingPage {
    // YAML block scalars keep their line breaks; a description reads as one line.
    const description = project.description.replace(/\s+/g, " ").trim();
    return {
      path: `/projects/${project.id}`,
      title: project.title,
      description,
      schemas: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: project.title,
          description,
          url: project.url,
          applicationCategory: "WebApplication",
          operatingSystem: "Any",
          author: AUTHOR,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: projectBreadcrumbs(project).map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.path),
          })),
        },
      ],
    };
  }

  return {
    SITE_URL,
    OG_IMAGE,
    absoluteUrl,
    pageTitle,
    headTags,
    HOME_META,
    ABOUT_META,
    PROJECTS_META,
    NOT_FOUND_META,
    projectMeta,
  };
}

export type Seo = ReturnType<typeof createSeo>;
