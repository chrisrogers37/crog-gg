import type { Project } from "../types";

/** The project index.yaml features, and the others in the index's order. */
export function splitFeatured(projects: Project[]) {
  return {
    featured: projects.find((project) => project.featured),
    others: projects.filter((project) => !project.featured),
  };
}
