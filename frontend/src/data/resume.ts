import { loadBio } from "../utils/bioLoader";
import { loadExperience } from "../utils/experienceLoader";
import { loadEducation } from "../utils/educationLoader";
import { loadSkills } from "../utils/skillsLoader";
import { loadProjects } from "../utils/projectLoader";
import { BioData, Employment, Education, Skill, Project } from "../types";

export interface ResumeData {
  bio: BioData;
  experience: Employment[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
}

// Create a function to load all resume data dynamically
export const loadResumeData = async (): Promise<ResumeData> => {
  try {
    // Load all data in parallel for better performance
    const [bioData, experienceData, educationData, skillsData, projectsData] =
      await Promise.all([
        loadBio(),
        loadExperience(),
        loadEducation(),
        loadSkills(),
        loadProjects(),
      ]);

    const result: ResumeData = {
      bio: bioData,
      experience: experienceData.experience,
      education: educationData.education,
      skills: skillsData.skills,
      projects: projectsData,
    };

    return result;
  } catch (error) {
    console.error("Error in loadResumeData:", error);
    throw error;
  }
};
