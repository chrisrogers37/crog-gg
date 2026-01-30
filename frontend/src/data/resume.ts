import { loadBio } from '../utils/bioLoader';
import { loadExperience } from '../utils/experienceLoader';
import { loadEducation } from '../utils/educationLoader';
import { loadSkills } from '../utils/skillsLoader';
import { BioData, Employment, Education, Skill } from '../types';

interface ResumeData {
  about: BioData;
  portfolio: {
    experience: Employment[];
    education: Education[];
  };
  skills: Skill[];
}

// Create a function to load all resume data dynamically
export const loadResumeData = async (): Promise<ResumeData> => {
  try {
    console.log('Loading bio data...');
    const bioData = await loadBio();
    console.log('Bio data loaded:', bioData);
    
    console.log('Loading experience data...');
    const experienceData = await loadExperience();
    console.log('Experience data loaded:', experienceData);
    
    console.log('Loading education data...');
    const educationData = await loadEducation();
    console.log('Education data loaded:', educationData);
    
    console.log('Loading skills data...');
    const skillsData = await loadSkills();
    console.log('Skills data loaded:', skillsData);
    
    const result = {
      about: bioData,
      portfolio: {
        experience: experienceData.experience,
        education: educationData.education
      },
      skills: skillsData.skills
    };
    
    console.log('All data loaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in loadResumeData:', error);
    throw error;
  }
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