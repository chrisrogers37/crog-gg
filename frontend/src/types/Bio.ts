import type { bioShape } from "../config/contentSchema";

/** bio.yaml, as checked (config/contentSchema.ts). */
export type BioData = ReturnType<typeof bioShape>;
