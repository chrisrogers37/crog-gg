// import yaml from 'js-yaml';
import { EducationData } from '../types/Education';

// Mock implementation for development
export const loadEducation = async (): Promise<EducationData> => {
  const mockEducation: EducationData = {
    education: [
      {
        school: "Columbia University",
        degree: "MS (partial); Applied Analytics",
        year: "2021"
      },
      {
        school: "Cornell University",
        degree: "MEng in Chemical Engineering",
        year: "2015"
      },
      {
        school: "Cornell University",
        degree: "BS in Chemical Engineering",
        year: "2014"
      }
    ]
  };

  return mockEducation;
};
