/**
 * A glob's entry for a file in the site folder. Vite keys an `@site/...` glob
 * by the file's path from frontend/, which depends on SITE_DIR, so this
 * matches the end: `inSite(files, "/public/logos/a.png")`.
 */
export const inSite = <T>(files: Record<string, T>, path: string): T | undefined =>
  Object.entries(files).find(([key]) => key.endsWith(path))?.[1];

// The share card's source, when the site keeps one: the PNG is rendered from it.
const cardSource = import.meta.glob<string>("@site/og-image.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The site's share card source (og-image.html), parsed, or undefined without one. */
export function shareCard(): Document | undefined {
  const [html] = Object.values(cardSource);
  return html === undefined ? undefined : new DOMParser().parseFromString(html, "text/html");
}

/** A node's text with its whitespace collapsed, so a wrapped phrase reads as one. */
export const textOf = (node: Node | null | undefined): string =>
  (node?.textContent ?? "").replace(/\s+/g, " ").trim();
