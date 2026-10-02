import type { Readme } from "../services/githubService";

/**
 * Links and images inside a GitHub README, re-pointed for rendering on one of
 * this site's project pages (#178).
 *
 * A README's relative links are relative to where it sits on GitHub. Rendered
 * on /projects/<slug> they resolved against this site instead and landed on the
 * 404 page (/projects/AGENTS.md, /projects/LICENSE, /projects/.claude/), so
 * they are resolved against the README's own GitHub URLs.
 */

/** Has a scheme ("https:", "mailto:") or is protocol-relative ("//host"). */
const isAbsolute = (url: string) =>
  /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//");

/**
 * `url` resolved against `fileUrl`, a GitHub file URL whose first
 * `rootSegments` path segments name the repo and ref. A leading "/" means the
 * repo root, as GitHub renders it, rather than the host root.
 */
function resolve(
  url: string | undefined,
  fileUrl: string,
  rootSegments: number,
) {
  if (!url || url.startsWith("#") || isAbsolute(url)) return url;
  const base = new URL(fileUrl);
  const root = base.pathname.split("/").slice(0, rootSegments + 1).join("/");
  return new URL(url.startsWith("/") ? root + url : url, base).toString();
}

/** A link's target: the file on GitHub (/owner/repo/blob/<ref>/...). */
export const readmeHref = (href: string | undefined, readme: Readme) =>
  resolve(href, readme.htmlUrl, 4);

/** An image's source: the raw file (/owner/repo/<ref>/...). */
export const readmeImageSrc = (src: string | undefined, readme: Readme) =>
  resolve(src, readme.downloadUrl, 3);

/**
 * A URL on the author's own machine, e.g. a dev server the README tells a
 * contributor to open. It means nothing to a visitor, so it is shown as text
 * rather than linked.
 */
export function isLocalDevUrl(href: string | undefined) {
  if (!href) return false;
  let hostname: string;
  try {
    hostname = new URL(href).hostname;
  } catch {
    return false;
  }
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    /^127(\.\d{1,3}){3}$/.test(hostname)
  );
}
