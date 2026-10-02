import type { timelineShape } from "../config/contentSchema";

/** timeline.yaml, as checked (config/contentSchema.ts). */
export type TimelineData = ReturnType<typeof timelineShape>;
export type TimelineEntry = TimelineData["entries"][number];
export type TimelineEntryType = TimelineEntry["type"];
export type SkillCategory = TimelineData["skill_categories"][string];
