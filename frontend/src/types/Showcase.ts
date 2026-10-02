import type { showcaseShape } from "../config/contentSchema";

/** One photo in showcase.yaml: `src` is a base path of its WebP variants (utils/photos.ts). */
export type ShowcaseImage = ReturnType<typeof showcaseShape>["images"][number];
