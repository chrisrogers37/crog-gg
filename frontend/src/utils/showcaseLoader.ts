import { showcaseShape } from "../config/contentSchema";
import type { ShowcaseImage } from "../types/Showcase";
import { loadContentFile } from "./contentFile";

/**
 * The photo strip's images. The strip is decoration, so a file that won't
 * load leaves it out (ImageShowcase shows nothing under three images) and
 * says why in the console, rather than taking anything else down.
 */
export const loadShowcase = async (): Promise<ShowcaseImage[]> => {
  try {
    return (await loadContentFile(showcaseShape, "showcase.yaml")).images;
  } catch (error) {
    console.error(error);
    return [];
  }
};
