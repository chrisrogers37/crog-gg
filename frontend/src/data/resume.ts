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
  about: {
    display_name: string;
    bio: string;
    email: string;
    location: string;
    socialLinks: {
      github: string;
      hoobe: string;
      spotify: string;
      linkedin: string;
    };
  };
  portfolio: {
    experience: Employment[];
    education: Education[];
  };
  skills: { name: string; weight: number }[];
}

export const defaultResume: ResumeData = {
  about: {
    display_name: "Christopher T. Rogers",
    bio: "I use data to tackle ambiguous business problems and deliver clear, actionable recommendations at the point of decision. I care deeply about building systems that make insight repeatable, whether that means automating workflows, designing scalable infrastructure, or creating tools that make analytics easier to deliver, use, and understand. I stay close to the cutting edge, regularly building and experimenting with AI-enriched processes, including retrieval-augmented generation (RAG), vector search, and other LLM-integrated approaches (click Summon New Lore to see one in action!).\n\nOutside of work, I spend a lot of time on music. I produce my own songs, experiment with audio engineering, and occasionally DJ around NYC. When I get the chance to escape the city, I enjoy traveling abroad to see new places or retreating to Maine to relax in nature with a few good books.\n\nFeel free to explore my experience, projects, and other interests by navigating through the other sections above.",
    email: "christophertrogers37@gmail.com",
    location: "New York City, New York",
    socialLinks: {
      github: "https://github.com/chrisrogers37/",
      hoobe: "https://hoo.be/crog",
      spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
      linkedin: "https://www.linkedin.com/in/chrisrogers37/"
    }
  },
  portfolio: {
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
    ],
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
  },
  skills: [
    { name: "python", weight: 7},
    { name: "object-oriented programming", weight: 5 },
    { name: "sql", weight: 9 },
    { name: "data modeling", weight: 7 },
    { name: "dbt", weight: 7 },
    { name: "google cloud platform", weight: 5 },
    { name: "airflow", weight: 5 },
    { name: "aws", weight: 5 },
    { name: "bigquery", weight: 8 },
    { name: "statistical testing", weight: 6 },
    { name: "tableau", weight: 9 },
    { name: "experimentation", weight: 5 },
    { name: "git", weight: 7 },
    { name: "llms", weight: 6 },
    { name: "docker", weight: 4 },
    { name: "kubernetes", weight: 5 },
    { name: "R", weight: 6 },
    { name: "metric design", weight: 6 },
    { name: "adobe premiere pro", weight: 4 },
    { name: "ableton", weight: 5 },
    { name: "regression", weight: 6 },
    { name: "classification", weight: 6 },
    { name: "natural language processing", weight: 6 },
    { name: "time series analysis", weight: 5 },
    { name: "forecasting", weight: 5 },
  ]
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