/**
 * A glob's entry for a file in the site folder. Vite keys an `@site/...` glob
 * by the file's path from frontend/, which depends on SITE_DIR, so this
 * matches the end: `inSite(files, "/public/logos/a.png")`.
 */
export const inSite = <T>(files: Record<string, T>, path: string): T | undefined =>
  Object.entries(files).find(([key]) => key.endsWith(path))?.[1];

// The share cards' sources, where the site keeps them: each PNG is rendered
// from one (scripts/og-image/render.mjs).
const cardSources = import.meta.glob<string>(
  ["@site/og-image.html", "@site/claudlobby-card.html"],
  { query: "?raw", import: "default", eager: true },
);

const parsedCard = (file: string): Document | undefined => {
  const html = inSite(cardSources, `/${file}`);
  return html === undefined ? undefined : new DOMParser().parseFromString(html, "text/html");
};

/** The site's share card source (og-image.html), parsed, or undefined without one. */
export const shareCard = () => parsedCard("og-image.html");

/** Claudlobby's page's own card source (claudlobby-card.html), parsed, or undefined. */
export const claudlobbyCard = () => parsedCard("claudlobby-card.html");

/** A node's text with its whitespace collapsed, so a wrapped phrase reads as one. */
export const textOf = (node: Node | null | undefined): string =>
  (node?.textContent ?? "").replace(/\s+/g, " ").trim();
