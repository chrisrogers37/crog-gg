/**
 * A glob's entry for a file in the site folder. Vite keys an `@site/...` glob
 * by the file's path from frontend/, which depends on SITE_DIR, so this
 * matches the end: `inSite(files, "/public/logos/a.png")`.
 */
export const inSite = <T>(files: Record<string, T>, path: string): T | undefined =>
  Object.entries(files).find(([key]) => key.endsWith(path))?.[1];

// The link-preview cards' sources, where the site keeps them: each
// site/<name>.html renders to site/public/<name>.png (scripts/og-image/render.mjs).
const cardSources = import.meta.glob<string>("@site/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The source of the card at `/<name>.png`, site/<name>.html, parsed; undefined without one. */
export const cardSource = (cardPath: string): Document | undefined => {
  const html = inSite(cardSources, cardPath.replace(/\.png$/, ".html"));
  return html === undefined ? undefined : new DOMParser().parseFromString(html, "text/html");
};

/** A node's text with its whitespace collapsed, so a wrapped phrase reads as one. */
export const textOf = (node: Node | null | undefined): string =>
  (node?.textContent ?? "").replace(/\s+/g, " ").trim();

/** A card's words, as its alt gives them: the headline, then the line under it. */
export const cardWords = (card: Document) =>
  `${textOf(card.querySelector("h1"))} ${textOf(card.querySelector(".sub"))}`;
