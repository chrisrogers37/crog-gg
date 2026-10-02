import type { SiteConfig } from "../config/schema";
import type { Project } from "../types/Project";

/**
 * The GitHub repo a project's page shows stats and a README for. It prefers the
 * explicit `github` field and falls back to `url` for entries whose primary
 * link is the repo itself: reading only `url` meant a declared `github` was
 * silently ignored, so any project pointing at a live app got no repo stats
 * and no docs. The API serves it by owner and name, for the owners site.yaml's
 * `github` allows (#189). A name may hold dots; a trailing `.git` isn't part
 * of it.
 */
export const githubRepo = (
  project: Project,
): { owner: string; name: string } | null => {
  const match = (project.github || project.url)?.match(
    /github\.com\/([\w-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/,
  );
  return match ? { owner: match[1], name: match[2] } : null;
};

/**
 * Whether the page embeds the project's demo: only when it goes somewhere
 * `url` doesn't, and isn't on github.com.
 */
export const hasLiveDemo = (project: Project): boolean =>
  !!project.demo &&
  !project.demo.includes("github.com") &&
  project.demo.replace(/\/$/, "") !== project.url?.replace(/\/$/, "");

/**
 * Whether the API serves this GitHub owner's repos: site.yaml's
 * github.username or one of its allowed_owners, in any case (#189). Any
 * other owner's repo gets the API's 404.
 */
export const isServedOwner = (site: Pick<SiteConfig, "github">, owner: string): boolean =>
  [site.github.username, ...(site.github.allowed_owners ?? [])].some(
    (name) => name.toLowerCase() === owner.toLowerCase(),
  );
