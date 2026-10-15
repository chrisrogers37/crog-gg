import type { Repository } from "../services/githubService";
import type { BioData, Project } from "../types";

// Whole records for tests (#198 M54). Each takes only the fields a test is
// about and fills in the rest, so a fixture is always a complete record, and
// the type checker can hold tests to the real types.

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

/** A /repo reply as the GitHub proxy sends it: all 16 fields. */
export const makeRepository = (overrides: Partial<Repository> = {}): Repository => ({
  name: "example",
  full_name: "owner/example",
  description: null,
  html_url: "https://github.com/owner/example",
  homepage: null,
  stargazers_count: 1,
  forks_count: 1,
  watchers_count: 1,
  open_issues_count: 0,
  language: "TypeScript",
  topics: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  pushed_at: "2026-09-01T00:00:00Z",
  license: null,
  default_branch: "main",
  ...overrides,
});
