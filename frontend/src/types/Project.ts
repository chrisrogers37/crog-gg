import type { RawProject } from "../config/contentSchema";

/**
 * A project as the site shows it: its file's fields (config/contentSchema.ts),
 * with `url` always set, and whether index.yaml features it.
 */
export type Project = Omit<RawProject, "url"> & { url: string; featured: boolean };
