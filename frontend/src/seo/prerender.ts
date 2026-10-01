import {
  HOME_META,
  NOT_FOUND_META,
  PROJECTS_META,
  absoluteUrl,
  headTags,
  jsonLd,
  pageTitle,
  projectMeta,
  type LandingPage,
  type PageMeta,
  type ProjectSummary,
} from "./site";

/**
 * The per-route <head> as HTML (#174). Pure string work so it can be tested;
 * scripts/vite-prerender.ts does the I/O.
 *
 * vercel.json has no catch-all rewrite. It serves the files the build writes
 * from landingPages() under `cleanUrls`, and answers every other path with
 * 404.html and a 404 status. So a route the router renders but this list
 * omits works in dev (Vite's SPA fallback) and 404s for anyone who lands on it
 * in production; router.test.tsx checks the two agree.
 */

/** Where index.html asks for the page head to be written. */
export const HEAD_MARKER = "<!--seo-head-->";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** The page's <head> tags, marked so react-helmet-async adopts them. */
export function renderHead(meta: PageMeta): string {
  const lines = [`<title>${escapeHtml(pageTitle(meta))}</title>`];
  for (const { tag, attrs } of headTags(meta)) {
    const rendered = Object.entries(attrs)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(" ");
    lines.push(`<${tag} data-rh="true" ${rendered} />`);
  }
  for (const schema of meta.schemas ?? []) {
    lines.push(
      `<script type="application/ld+json" data-rh="true">${jsonLd(schema)}</script>`,
    );
  }
  return lines.join("\n    ");
}

/** index.html with the marker replaced by `meta`'s head. */
export function renderPage(template: string, meta: PageMeta): string {
  if (!template.includes(HEAD_MARKER)) {
    throw new Error(
      `index.html has no ${HEAD_MARKER} marker, so there is nowhere to write the page head`,
    );
  }
  // A replacer function, so a `$` in the head is never read as a pattern.
  return template.replace(HEAD_MARKER, () => renderHead(meta));
}

/**
 * Every page a visitor can land on directly. 404.html is written besides
 * these, from NOT_FOUND_META, and answers every other path.
 */
export const landingPages = (projects: ProjectSummary[]): LandingPage[] => [
  HOME_META,
  PROJECTS_META,
  ...projects.map(projectMeta),
];

/** The file `cleanUrls` serves at a path: "/" is index.html, "/a/b" is a/b.html. */
export const fileFor = (path: string) =>
  path === "/" ? "index.html" : `${path.slice(1)}.html`;

/** The head the dev server gives a URL: its landing page's, else the 404's. */
export const pageFor = (pathname: string, projects: ProjectSummary[]) =>
  landingPages(projects).find((page) => page.path === pathname) ??
  NOT_FOUND_META;

/**
 * sitemap.xml for the landing pages, which are exactly the indexable ones, so
 * it cannot list a page the build did not write (#178: the hand-kept file had
 * drifted to two dead slugs and missed four live ones).
 */
export function renderSitemap(pages: LandingPage[], lastmod: string): string {
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeHtml(absoluteUrl(page.path))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const renderRobots = () =>
  `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
