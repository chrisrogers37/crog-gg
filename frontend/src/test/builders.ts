import type { BioData, Education, Employment } from "../types";

// Whole content records for tests (#198 M54). Each takes only the fields a
// test is about and fills in the rest, so a fixture is always a complete
// record, and the type checker can hold tests to the real types.

export const makeBio = (overrides: Partial<BioData> = {}): BioData => ({
  display_name: "Test User",
  email: "test@example.com",
  location: "Somewhere",
  about_text: "About me.",
  social_links: { github: "", hoobe: "", spotify: "", linkedin: "" },
  ...overrides,
});

export const makeEmployment = (
  overrides: Partial<Employment> = {},
): Employment => ({
  title: "Engineer",
  company: "Somewhere",
  period: "2020 - 2021",
  achievements: [],
  ...overrides,
});

export const makeEducation = (
  overrides: Partial<Education> = {},
): Education => ({
  school: "Somewhere Else",
  degree: "BSc",
  year: "2020",
  ...overrides,
});
