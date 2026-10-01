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
 */

/** The canonical origin. Every absolute self-URL is built from it. */
export const SITE_URL = "https://crog.gg";

const SITE_NAME = "Chris Rogers - i build things that build things";

export const OG_IMAGE = {
  path: "/og-image.png",
  width: 1200,
  height: 630,
  // The card's own text (scripts/og-image/og-image.html); site.test.ts checks
  // the two agree.
  alt: "Build a dark factory. Claudlobby runs a fleet of always-on Claude Code agents on your own hardware, composed from one fleet.yaml.",
} as const;

export type PageMeta = {
  /**
   * Site-relative path: the canonical URL and og:url. A page that must not be
   * indexed has none.
   */
  path?: string;
  /** Page title; the site name is appended. The home page omits it. */
  title?: string;
  description: string;
  type?: "website" | "profile";
  noIndex?: boolean;
  /** JSON-LD objects describing the page. */
  schemas?: object[];
};

/** A page a visitor can land on, so it has a URL. */
export type LandingPage = PageMeta & { path: string };

const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

export const pageTitle = (meta: PageMeta) =>
  meta.title ? `${meta.title} | ${SITE_NAME}` : SITE_NAME;

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
 * The page's meta and link tags, in the order they are written. The title and
 * JSON-LD are rendered separately: Helmet manages the title through
 * document.title, and JSON-LD goes through jsonLd().
 */
export function headTags(meta: PageMeta): HeadTag[] {
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
    property("og:site_name", SITE_NAME),
    ...(canonical ? [property("og:url", canonical)] : []),
    named("twitter:card", "summary_large_image"),
    named("twitter:title", title),
    named("twitter:description", meta.description),
    named("twitter:image", image),
    named("twitter:image:alt", OG_IMAGE.alt),
  ];
}

/**
 * A JSON-LD object serialized for a <script> body. `<` is escaped so that no
 * string inside the schema can close the script it is written into; `<`
 * is still `<` to any JSON parser.
 */
export const jsonLd = (schema: object) =>
  JSON.stringify(schema).replace(/</g, "\\u003c");

const AUTHOR = {
  "@type": "Person",
  name: "Chris Rogers",
  url: SITE_URL,
} as const;

export const HOME_META: LandingPage = {
  path: "/",
  description:
    "Agentic AI builder. Creator of Claudlobby (fleet compositor for Claude Code). Data platform lead at Artemis.",
  type: "profile",
  schemas: [
    {
      "@context": "https://schema.org",
      ...AUTHOR,
      image: absoluteUrl("/profile-photo.jpg"),
      jobTitle: "Builder of Things That Sometimes Work",
      sameAs: [
        "https://github.com/chrisrogers37",
        "https://linkedin.com/in/chrisrogers37",
        "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
      ],
      knowsAbout: [
        "Software Development",
        "Web Development",
        "Data Engineering",
        "Python",
        "TypeScript",
        "React",
      ],
    },
  ],
};

export const PROJECTS_META: LandingPage = {
  path: "/projects",
  title: "Projects",
  description:
    "Explore my portfolio of software projects, side projects, and experiments. From web apps to mobile development.",
};

export const NOT_FOUND_META: PageMeta = {
  title: "Page not found",
  description: "This page doesn't exist. Head back to crog.gg to find your way.",
  noIndex: true,
};

export type ProjectSummary = Pick<Project, "id" | "title" | "description" | "url">;

/** The trail ProjectDetailPage shows, and the BreadcrumbList describing it. */
export const projectBreadcrumbs = (project: ProjectSummary) => [
  { label: "Home", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: project.title, path: `/projects/${project.id}` },
];

export function projectMeta(project: ProjectSummary): LandingPage {
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
