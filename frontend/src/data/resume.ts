import { loadExperience } from "../utils/experienceLoader";
import { loadEducation } from "../utils/educationLoader";
import { loadSkills } from "../utils/skillsLoader";
import { Employment, Education, Skill } from "../types";

/**
 * The résumé files no page renders (#159, #190): experience, education and
 * skills. They're still loaded, for DISPEL's originals, until #159 decides
 * whether they go or get a page, and a failure in them takes nothing down.
 */
export type Resume = {
  experience: Employment[];
  education: Education[];
  skills: Skill[];
};

export const loadResume = async (): Promise<Resume> => {
  const [experience, education, skills] = await Promise.all([
    loadExperience(),
    loadEducation(),
    loadSkills(),
  ]);
  return {
    experience: experience.experience,
    education: education.education,
    skills: skills.skills,
  };
};
