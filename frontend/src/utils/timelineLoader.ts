import yaml from "js-yaml";
import { TimelineData } from "../types/Timeline";

export async function loadTimeline(): Promise<TimelineData> {
  try {
    const response = await fetch("/content/timeline.yaml");
    if (!response.ok) {
      throw new Error(`Failed to load timeline: ${response.status}`);
    }
    const text = await response.text();
    const data = yaml.load(text) as TimelineData;
    return data;
  } catch (error) {
    console.error("Failed to load timeline data:", error);
    return { entries: [], skill_categories: {} };
  }
}
