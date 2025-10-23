import yaml from 'js-yaml';
import { EducationData } from '../types/Education';

export const loadEducation = async (): Promise<EducationData> => {
  try {
    // Fetch the YAML file from the content directory
    const response = await fetch('/content/education.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch education.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const educationData = yaml.load(content) as EducationData;
    
    console.log('Education data loaded from YAML:', educationData);
    return educationData;
  } catch (error) {
    console.error('Error loading education from YAML:', error);
    throw error;
  }
};
