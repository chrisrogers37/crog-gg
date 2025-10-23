import yaml from 'js-yaml';
import { SkillsData } from '../types/Skills';

export const loadSkills = async (): Promise<SkillsData> => {
  try {
    // Fetch the YAML file from the content directory
    const response = await fetch('/content/skills.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch skills.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const skillsData = yaml.load(content) as SkillsData;
    
    console.log('Skills data loaded from YAML:', skillsData);
    return skillsData;
  } catch (error) {
    console.error('Error loading skills from YAML:', error);
    throw error;
  }
};
