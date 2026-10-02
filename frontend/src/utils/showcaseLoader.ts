import yaml from "js-yaml";
import type { ShowcaseImage } from "../types/Showcase";

type ShowcaseData = {
  images: ShowcaseImage[];
};

export const loadShowcase = async (): Promise<ShowcaseImage[]> => {
  try {
    const response = await fetch("/content/showcase.yaml");
    if (!response.ok) {
      throw new Error(`Failed to fetch showcase.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const data = yaml.load(content) as ShowcaseData;
    return data.images || [];
  } catch (error) {
    console.error("Error loading showcase from YAML:", error);
    return [];
  }
};
