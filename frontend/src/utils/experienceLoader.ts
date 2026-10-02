import yaml from "js-yaml";
import { ExperienceData } from "../types/Experience";

export const loadExperience = async (): Promise<ExperienceData> => {
  try {
    // Fetch the YAML file from the content directory
    const response = await fetch("/content/experience.yaml");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch experience.yaml: ${response.statusText}`,
      );
    }
    const content = await response.text();
    const experienceData = yaml.load(content) as ExperienceData;
    return experienceData;
  } catch (error) {
    console.error("Error loading experience from YAML:", error);
    throw error;
  }
};
