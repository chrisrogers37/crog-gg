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
 * The SPA rewrite serves index.html for any path it does not recognise, so a
 * project YAML that is missing, renamed or misspelled in the index arrives as
 * an HTML document with status 200 and content-type text/html. `response.ok`
 * is therefore not an existence check for these assets.
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
  const indexResponse = await fetch("/content/projects/index.yaml");
  if (!indexResponse.ok) {
    throw new Error(
      `Failed to fetch project index: ${indexResponse.status} ${indexResponse.statusText}`,
    );
  }

  const indexData = yaml.load(await indexResponse.text());
  if (!isProjectIndex(indexData)) {
    throw new Error(
      "Project index did not parse to { projects: string[] } — it was most likely served the SPA fallback HTML",
    );
  }

  const projects = await Promise.all(
    indexData.projects.map(async (file: string) => {
      const response = await fetch(`/content/projects/${file}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
      }

      const parsed = yaml.load(await response.text());
      if (!isRawProject(parsed)) {
        throw new Error(
          `${file} did not parse to a project object — the file is most likely missing and was served the SPA fallback HTML`,
        );
      }

      return toProject(parsed);
    }),
  );

  return projects.sort((a, b) => a.order - b.order);
};
