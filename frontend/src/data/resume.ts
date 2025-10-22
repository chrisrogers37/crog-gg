import { loadBio } from '../utils/bioLoader';
import { loadExperience } from '../utils/experienceLoader';
import { loadEducation } from '../utils/educationLoader';
import { loadSkills } from '../utils/skillsLoader';
import { BioData } from '../types/Bio';

export interface Employment {
  title: string;
  company: string;
  period: string;
  achievements: readonly string[];
}

export interface Education {
  school: string;
  degree: string;
  year: string;
}

interface ResumeData {
  about: BioData;
  portfolio: {
    experience: Employment[];
    education: Education[];
  };
  skills: { name: string; weight: number }[];
}

// Create a function to load all resume data dynamically
export const loadResumeData = async (): Promise<ResumeData> => {
  const [bioData, experienceData, educationData, skillsData] = await Promise.all([
    loadBio(),
    loadExperience(),
    loadEducation(),
    loadSkills()
  ]);
  
  return {
    about: bioData,
    portfolio: {
      experience: experienceData.experience,
      education: educationData.education
    },
    skills: skillsData.skills
  };
};


// Helper function to get a random transition effect
export const transitions = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'rotate',
  'scale'
] as const;

export const getRandomTransition = () => {
  return transitions[Math.floor(Math.random() * transitions.length)];
};