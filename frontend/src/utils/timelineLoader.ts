import { timelineShape } from "../config/contentSchema";
import type { TimelineData } from "../types/Timeline";
import { loadContentFile } from "./contentFile";

/**
 * timeline.yaml, checked as it loads (#190 M22): dates are normalised, a
 * missing `skills` is none, and each category's colour is #rrggbb. A file
 * that doesn't fit throws, naming the file and the field.
 */
export const loadTimeline = (): Promise<TimelineData> =>
  loadContentFile(timelineShape, "timeline.yaml");
