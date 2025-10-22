export interface Employment {
  title: string;
  company: string;
  period: string;
  achievements: string[];
}

export interface ExperienceData {
  experience: Employment[];
}
