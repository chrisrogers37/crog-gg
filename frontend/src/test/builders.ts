import type { BioData, Project } from "../types";

// Whole content records for tests (#198 M54). Each takes only the fields a
// test is about and fills in the rest, so a fixture is always a complete
// record, and the type checker can hold tests to the real types.

export const makeBio = (overrides: Partial<BioData> = {}): BioData => ({
  display_name: "Test User",
  location: "Somewhere",
  about_text: "About me.",
  ...overrides,
});

export const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: "example",
  title: "Example",
  description: "An example project.",
  url: "https://example.com",
  icon: "\u{1F680}",
  category: "web-app",
  technologies: [],
  featured: false,
  ...overrides,
});
