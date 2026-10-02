import yaml from "js-yaml";
import { TimelineData } from "../types/Timeline";
import { skillColor } from "./skillColor";

export async function loadTimeline(): Promise<TimelineData> {
  try {
    const response = await fetch("/content/timeline.yaml");
    if (!response.ok) {
      throw new Error(`Failed to load timeline: ${response.status}`);
    }
    const text = await response.text();
    const data = yaml.load(text) as TimelineData;
    // Each category's colour is checked once, here: SkillBubbles appends alpha
    // pairs to it, which only works on #rrggbb. A category with no body is left
    // for the section's error card to report, as before.
    data.skill_categories ??= {};
    for (const category of Object.values(data.skill_categories)) {
      if (category && typeof category === "object") {
        category.color = skillColor(category.color);
      }
    }
    return data;
  } catch (error) {
    console.error("Failed to load timeline data:", error);
    return { entries: [], skill_categories: {} };
  }
}
