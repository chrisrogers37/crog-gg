import yaml from 'js-yaml';
import { ExperienceData } from '../types/Experience';

// Mock implementation for development
export const loadExperience = async (): Promise<ExperienceData> => {
  const mockExperience: ExperienceData = {
    experience: [
      {
        title: "Analytics Engineer",
        company: "Citadel",
        period: "2023 - Present",
        achievements: [
          "Worked to streamline and automate the Strategic Finance Data & Analytics team's data workflows, contributing to a cultural shift toward centralized, scalable operations. Helped establish core infrastructure and onboard the team to Google Kubernetes Engine (GKE) and Citadel's Airflow-like scheduler, significantly reducing manual processing time.",
          "Designed and built a configurable Python orchestration framework to automate end-to-end workflows across BigQuery, Python, and Tableau, improving dependency management and reducing redundant code while making onboarding and setup easier.",
          "Led efforts to modernize a key Tableau dashboard, improving data sourcing, calculations, and interactivity to better support decision-making. Introduced a user feedback loop, leading to refinements that increased engagement among stakeholders.",
          "Supported the migration of 100+ tables and views from SQL Server to BigQuery, helping to redesign data flows for scalability, reduced query complexity, and improved maintainability.",
          "Helped drive team-wide initiatives focused on improving development processes and reducing technical debt, including co-founding 'Tech Debt Friday'—a collaborative effort to modernize workflows and streamline legacy processes."
        ]
      },
      {
        title: "Data Scientist",
        company: "Meta",
        period: "December 2021 - February 2023",
        achievements: [
          "Worked with five Recruiting Product teams to support metric design, experimentation, and forecasting, helping to improve candidate experience and hiring efficiency.",
          "Conducted a data-driven investigation into referral candidate outcomes, identifying thousands of high-value candidates stalled in the hiring pipeline. Insights from this work helped recruiters re-engage these candidates, led to software improvements that addressed root causes, and mitigated potential reputational risks in the referral process.",
          "Used Fixed Effects modeling to quantify the variance in hiring outcomes attributable to recruiter assignment, helping inform recruiter training, assignment strategies, and tooling enhancements.",
          "Supported numerous A/B experiments by designing metrics, analyzing results, and improving experimental methodology to drive data-informed decision-making in recruiting strategies."
        ]
      },
      {
        title: "Business Intelligence Analyst II",
        company: "Memorial Sloan Kettering",
        period: "October 2018 - December 2021",
        achievements: [
          "Published author and technical lead on an NLP research study with Weill Cornell Medical College, using classification algorithms to analyze patient messages and identify patterns related to social risk factors.",
          "Conducted a longitudinal study on patient health metrics that informed hospital-wide policy updates and optimized measurement schedules to improve medication accuracy and treatment planning."
        ]
      }
    ]
  };

  return mockExperience;
};
