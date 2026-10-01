import yaml from "js-yaml";
import { Project } from "../types/Project";

/**
 * Raw YAML project data structure before mapping to Project interface
 */
interface RawProjectData {
  id: string;
  title: string;
  description: string;
  url?: string;
  demo?: string;
  demo_url?: string;
  github?: string;
  github_url?: string;
  icon: string;
  category: string;
  technologies?: string[];
  featured?: boolean;
  order?: number;
  image?: string;
  gradient?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}

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
 * *string* rather than throwing, so every field read off it is `undefined` and
 * the result is a blank card rendered as though it were a project. The shape of
 * what parsed has to be checked, because neither the status nor the parse will
 * report the problem.
 */
const isRawProject = (value: unknown): value is RawProjectData =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as RawProjectData).id === "string";

const isProjectIndex = (value: unknown): value is { projects: string[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { projects?: unknown }).projects);

const toProject = (projectData: RawProjectData): Project => ({
  id: projectData.id,
  title: projectData.title,
  description: projectData.description,
  url:
    projectData.url ||
    projectData.demo ||
    projectData.demo_url ||
    projectData.github ||
    projectData.github_url ||
    "#",
  icon: projectData.icon,
  category: projectData.category,
  technologies: projectData.technologies || [],
  featured: projectData.featured || false,
  order: projectData.order || 999,
  image: projectData.image,
  gradient: projectData.gradient,
  github: projectData.github || projectData.github_url,
  demo: projectData.demo || projectData.demo_url,
  status: projectData.status,
  tags: projectData.tags || [],
});

/**
 * index.yaml is the curated list, and it is the only one.
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
export const loadProjects = async (): Promise<Project[]> => {
  const projects = await readProjects(async (file) => {
    const response = await fetch(`/content/projects/${file}`);
    if (!response.ok) {
      throw new Error(
        file === "index.yaml"
          ? `Failed to fetch project index: ${response.status} ${response.statusText}`
          : `Failed to fetch ${file}: ${response.statusText}`,
      );
    }
    return response.text();
  });

  return projects.sort((a, b) => a.order - b.order);
};

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
  const files = parseProjectIndex(await read("index.yaml"));
  return Promise.all(
    files.map(async (file) => parseProject(await read(file), file)),
  );
};

// A missing file answered by an SPA fallback parses to a string, which is the
// usual way these fail in the browser (see isRawProject above).
const parseProjectIndex = (text: string): string[] => {
  const indexData = yaml.load(text);
  if (!isProjectIndex(indexData)) {
    throw new Error(
      "Project index did not parse to { projects: string[] }; an SPA fallback page parses to a string",
    );
  }
  return indexData.projects;
};

// An id becomes a URL and a prerendered file, so it's one lowercase slug.
const PROJECT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseProject = (text: string, file: string): Project => {
  const parsed = yaml.load(text);
  if (!isRawProject(parsed)) {
    throw new Error(
      `${file} did not parse to a project object; an SPA fallback page parses to a string`,
    );
  }
  if (!PROJECT_ID.test(parsed.id)) {
    throw new Error(
      `${file}: id "${parsed.id}" must be lowercase letters, digits and single hyphens; it becomes the page's URL`,
    );
  }
  if (typeof parsed.title !== "string" || typeof parsed.description !== "string") {
    throw new Error(`${file}: title and description must both be strings`);
  }
  return toProject(parsed);
};
