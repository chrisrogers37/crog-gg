import { projectIndexShape, projectShape, type RawProject } from "../config/contentSchema";
import type { Project } from "../types/Project";
import { fetchContent, parseYaml } from "./contentFile";

/**
 * A 200 does not mean the file exists.
 *
 * An SPA fallback serves index.html for any path it does not recognise, so a
 * project YAML that is missing, renamed or misspelled in the index arrives as
 * an HTML document with status 200 and content-type text/html. Production no
 * longer has one (#174: unknown paths are real 404s), but the Vite dev server
 * still does, so `response.ok` is still not an existence check for these
 * assets everywhere they are read.
 *
 * js-yaml does not rescue that either: given an HTML document it returns a
 * *string* rather than throwing. The shape check is what catches it: a string
 * isn't the mapping a project file is ("the file: expected a mapping").
 */

/** A project as the page shows it: `url` falls back to the demo, then the repo. */
const toProject = ({ url, ...project }: RawProject, featured: boolean): Project => ({
  ...project,
  url: url ?? project.demo ?? project.github ?? "#",
  featured,
});

/**
 * index.yaml is the curated list, and it is the only one: what it lists, in
 * its order, is what the site shows (#190 M24).
 *
 * There used to be a hardcoded fallback list here for when the index fetch
 * failed. It was removed rather than resynced, because no correct version of it
 * exists: a second literal list is a source of truth that must be kept in step
 * by hand and had already drifted (it named a file that no longer exists, and
 * omitted three that do), while deriving the list from the directory instead
 * would surface projects the index deliberately withholds. The curation lives
 * in the index and nowhere else, so when the index is unavailable there is
 * nothing faithful left to render, and saying so beats quietly rendering a
 * different portfolio.
 */
export const loadProjects = (): Promise<Project[]> =>
  readProjects((file) => fetchContent(`projects/${file}`));

/**
 * The projects index.yaml lists, in index order. `read` returns a file's text
 * by its name in content/projects/: a fetch in the browser, the filesystem at
 * build time, where scripts/vite-prerender.ts writes a page per project from
 * this. So a project file that would fail to load fails the build instead of
 * shipping a page.
 */
export const readProjects = async (
  read: (file: string) => Promise<string>,
): Promise<Project[]> => {
  const index = parseYaml(projectIndexShape, await read("index.yaml"), "content/projects/index.yaml");
  const twice = index.projects.find((file, i) => index.projects.indexOf(file) !== i);
  if (twice) throw new Error(`content/projects/index.yaml lists ${twice} twice`);
  if (index.featured && !index.projects.includes(index.featured)) {
    throw new Error(
      `content/projects/index.yaml features ${index.featured}, which it doesn't list`,
    );
  }
  return Promise.all(
    index.projects.map(async (file) =>
      toProject(
        parseYaml(projectShape, await read(file), `content/projects/${file}`),
        file === index.featured,
      ),
    ),
  );
};
