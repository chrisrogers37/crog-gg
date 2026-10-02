import type { Project } from "../types/Project";

/**
 * The GitHub repo a project's page shows stats and a README for. It prefers the
 * explicit `github` field and falls back to `url` for entries whose primary
 * link is the repo itself: reading only `url` meant a declared `github` was
 * silently ignored, so any project pointing at a live app got no repo stats
 * and no docs. The API takes only `name`, and looks it up under the site's own
 * GitHub owner.
 */
export const githubRepo = (
  project: Project,
): { owner: string; name: string } | null => {
  const match = (project.github || project.url)?.match(
    /github\.com\/([\w-]+)\/([\w-]+)/,
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
