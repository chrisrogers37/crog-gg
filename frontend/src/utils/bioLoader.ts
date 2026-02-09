import yaml from "js-yaml";
import { BioData } from "../types/Bio";

export const loadBio = async (): Promise<BioData> => {
  try {
    // Fetch the YAML file from the content directory
    const response = await fetch("/content/bio.yaml");
    if (!response.ok) {
      throw new Error(`Failed to fetch bio.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const bioData = yaml.load(content) as BioData;

    console.log("Bio data loaded from YAML:", bioData);
    return bioData;
  } catch (error) {
    console.error("Error loading bio from YAML:", error);
    throw error;
  }
};
