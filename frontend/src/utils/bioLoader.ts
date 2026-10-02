import { bioShape } from "../config/contentSchema";
import type { BioData } from "../types/Bio";
import { loadContentFile } from "./contentFile";

export const loadBio = (): Promise<BioData> => loadContentFile(bioShape, "bio.yaml");
