import { readProjects } from "../utils/projectLoader";
import { inSite } from "./site";

// The shipped project YAML, read through Vite so a moved file fails here.
const projectFiles = import.meta.glob<string>(
  "@site/public/content/projects/*.yaml",
  { query: "?raw", import: "default", eager: true },
);

/** The projects the site ships, read with the site's own loader. */
export const shippedProjects = () =>
  readProjects(async (file) => {
    const text = inSite(projectFiles, `/content/projects/${file}`);
    if (text === undefined) {
      throw new Error(`index.yaml lists ${file}, which does not exist`);
    }
    return text;
  });
