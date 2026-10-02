import type { SiteConfig } from "../config/schema";
import { socialsIn } from "../config/socials";
import { claudlobby } from "../content/claudlobby";
import { CLAUDLOBBY_REPO } from "../content/links";
import { hasOwnPage, type OwnPageId } from "../content/ownPages";
import type { Project } from "../types/Project";

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

/** A link preview's image: the site's card, or a page's own. */
export type ShareImage = SiteConfig["seo"]["image"];

export type PageMeta = {
  /**
   * Site-relative path: the canonical URL and og:url. A page that must not be
   * indexed has none.
   */
  path?: string;
  /**
   * Page title; the site name is appended. The home page has none, so its
   * title is the site name alone.
   */
  title?: string;
  description: string;
  type?: "website" | "profile";
  noIndex?: boolean;
  /** JSON-LD objects describing the page. */
  schemas?: object[];
  /** The page's own link preview, where it isn't the site's card. */
  image?: ShareImage;
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

  const pageTitle = (meta: PageMeta) =>
    meta.title ? `${meta.title} | ${site.seo.site_name}` : site.seo.site_name;

  /**
   * The page's meta and link tags, in the order they are written. The title
   * and JSON-LD are rendered separately: Helmet manages the title through
   * document.title, and JSON-LD goes through jsonLd().
   */
  function headTags(meta: PageMeta): HeadTag[] {
    const title = pageTitle(meta);
    const card = meta.image ?? OG_IMAGE;
    const image = absoluteUrl(card.path);
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
      property("og:image:width", String(card.width)),
      property("og:image:height", String(card.height)),
      property("og:image:alt", card.alt),
      property("og:type", meta.type ?? "website"),
      property("og:site_name", site.seo.site_name),
      ...(canonical ? [property("og:url", canonical)] : []),
      named("twitter:card", "summary_large_image"),
      named("twitter:title", title),
      named("twitter:description", meta.description),
      named("twitter:image", image),
      named("twitter:image:alt", card.alt),
    ];
  }

  const AUTHOR = {
    "@type": "Person",
    name: site.owner.name,
    url: SITE_URL,
  } as const;

  const { works_for: worksFor } = site.owner;

  /** The home page: the owner's, so it's who the Person schema describes. */
  const HOME_META: LandingPage = {
    path: "/",
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

  /**
   * A page of its own says what it is in its own terms: Claudlobby's is
   * source code, with its own share card in Claudfather's colours. Every own
   * page has an entry, or the type check fails.
   */
  const OWN_PAGE_HEADS: Record<
    OwnPageId,
    (project: ProjectSummary, description: string) => { image: ShareImage; schema: object }
  > = {
    claudlobby: (project, description) => ({
      image: claudlobby.brand.card,
      schema: {
        "@context": "https://schema.org",
        "@type": "SoftwareSourceCode",
        name: project.title,
        description,
        url: absoluteUrl(`/projects/${project.id}`),
        codeRepository: CLAUDLOBBY_REPO,
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        programmingLanguage: "Python",
        runtimePlatform: "Claude Code",
        author: AUTHOR,
      },
    }),
  };

  function projectMeta(project: ProjectSummary): LandingPage {
    // YAML block scalars keep their line breaks; a description reads as one line.
    const description = project.description.replace(/\s+/g, " ").trim();
    const own = hasOwnPage(project.id) ? OWN_PAGE_HEADS[project.id](project, description) : undefined;
    return {
      path: `/projects/${project.id}`,
      title: project.title,
      description,
      ...(own && { image: own.image }),
      schemas: [
        own?.schema ?? {
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

  /** The site's own pages, before the projects, in sitemap order. */
  const PAGES: LandingPage[] = [HOME_META, PROJECTS_META];

  return {
    SITE_URL,
    OG_IMAGE,
    absoluteUrl,
    pageTitle,
    headTags,
    HOME_META,
    PROJECTS_META,
    NOT_FOUND_META,
    PAGES,
    projectMeta,
  };
}

export type Seo = ReturnType<typeof createSeo>;
