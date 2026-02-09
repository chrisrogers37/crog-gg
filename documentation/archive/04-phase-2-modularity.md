# 04 - Phase 2: Modularity

## Overview

**Goal**: Break down large components into smaller, focused modules. Implement proper state management to replace the CustomEvent pattern.

**Estimated Effort**: 21 story points

**Prerequisites**:

- Phase 1 completed and verified
- Understanding of Zustand basics

**Deliverables**:

1. Portfolio.tsx split into 4 section components
2. Zustand store replacing CustomEvent pattern
3. Custom hooks for data loading and regeneration
4. Layout components extracted
5. All existing functionality preserved

---

## Table of Contents

1. [Task 2.1: Install Zustand](#task-21-install-zustand)
2. [Task 2.2: Create Content Store](#task-22-create-content-store)
3. [Task 2.3: Create UI Store](#task-23-create-ui-store)
4. [Task 2.4: Split Portfolio Component](#task-24-split-portfolio-component)
5. [Task 2.5: Extract Layout Components](#task-25-extract-layout-components)
6. [Task 2.6: Create Custom Hooks](#task-26-create-custom-hooks)
7. [Task 2.7: Update HomePage to Use Stores](#task-27-update-homepage-to-use-stores)
8. [Task 2.8: Remove CustomEvent Pattern](#task-28-remove-customevent-pattern)
9. [Verification Checklist](#verification-checklist)
10. [Common Issues](#common-issues)

---

## Task 2.1: Install Zustand

### What We're Doing

Installing Zustand for lightweight state management.

### Steps

```bash
cd frontend
npm install zustand
```

### Verify Installation

```json
// package.json
{
  "dependencies": {
    "zustand": "^4.5.0"
  }
}
```

### Why Zustand

| Feature              | Zustand | Redux | Context |
| -------------------- | ------- | ----- | ------- |
| Bundle size          | ~1KB    | ~10KB | 0       |
| Boilerplate          | Minimal | High  | Medium  |
| Selective re-renders | Yes     | Yes   | No      |
| DevTools             | Yes     | Yes   | No      |
| Learning curve       | Low     | High  | Low     |

---

## Task 2.2: Create Content Store

### What We're Doing

Creating a Zustand store to manage all content state, replacing the CustomEvent pattern.

### Create Directory Structure

```bash
mkdir -p frontend/src/store
```

### Create File: `frontend/src/store/contentStore.ts`

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  BioData,
  ExperienceItem,
  EducationItem,
  SkillItem,
  Project,
} from "../types";
import { loadResumeData } from "../data/resume";

// ===========================================
// TYPES
// ===========================================

interface ContentState {
  // Data
  bio: BioData | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: Project[];

  // Original data for reset functionality
  originalBio: BioData | null;
  originalExperience: ExperienceItem[];
  originalEducation: EducationItem[];

  // Loading states
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;

  // Modification tracking
  hasModifiedContent: boolean;
}

interface ContentActions {
  // Data loading
  loadContent: () => Promise<void>;

  // Content regeneration
  regenerateContent: (section: string, useFantasy: boolean) => Promise<void>;

  // Reset to original
  resetContent: () => void;

  // Clear error
  clearError: () => void;
}

type ContentStore = ContentState & ContentActions;

// ===========================================
// INITIAL STATE
// ===========================================

const initialState: ContentState = {
  bio: null,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  originalBio: null,
  originalExperience: [],
  originalEducation: [],
  isLoading: true,
  isRegenerating: false,
  error: null,
  hasModifiedContent: false,
};

// ===========================================
// API HELPERS
// ===========================================

const API_URL = import.meta.env.VITE_API_URL || "https://api.crog.gg";

interface RegenerateRequest {
  section: string;
  current_content: {
    bio: BioData | null;
    experience: ExperienceItem[];
    education: EducationItem[];
  };
  use_fantasy: boolean;
}

interface RegenerateResponse {
  about_text?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
}

async function callRegenerateAPI(
  request: RegenerateRequest,
): Promise<RegenerateResponse> {
  const response = await fetch(`${API_URL}/api/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ===========================================
// STORE IMPLEMENTATION
// ===========================================

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // ===========================================
      // ACTIONS
      // ===========================================

      /**
       * Load all content from YAML files.
       * Called once on app initialization.
       */
      loadContent: async () => {
        try {
          set({ isLoading: true, error: null });

          const data = await loadResumeData();

          set({
            bio: data.bio,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            // Store originals for reset
            originalBio: data.bio,
            originalExperience: data.experience,
            originalEducation: data.education,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to load content:", error);
          set({
            error: "Failed to load content. Please refresh the page.",
            isLoading: false,
          });
        }
      },

      /**
       * Regenerate content using the AI API.
       *
       * @param section - The section to regenerate ('about', 'experience', 'education', 'portfolio')
       * @param useFantasy - Whether to use fantasy/LOTR style
       */
      regenerateContent: async (section: string, useFantasy: boolean) => {
        const state = get();

        // Don't regenerate if no content or already regenerating
        if (!state.bio || state.isRegenerating) {
          return;
        }

        try {
          set({ isRegenerating: true, error: null });

          const request: RegenerateRequest = {
            section,
            current_content: {
              bio: state.bio,
              experience: state.experience,
              education: state.education,
            },
            use_fantasy: useFantasy,
          };

          const response = await callRegenerateAPI(request);

          // Update state based on section
          if (section === "about" && response.about_text) {
            set((state) => ({
              bio: state.bio
                ? { ...state.bio, about_text: response.about_text! }
                : null,
              hasModifiedContent: true,
              isRegenerating: false,
            }));
          } else if (
            ["experience", "education", "portfolio"].includes(section)
          ) {
            set({
              experience: response.experience || state.experience,
              education: response.education || state.education,
              hasModifiedContent: true,
              isRegenerating: false,
            });
          } else {
            set({ isRegenerating: false });
          }
        } catch (error) {
          console.error("Regeneration failed:", error);
          set({
            error: "Failed to regenerate content. Please try again.",
            isRegenerating: false,
          });
        }
      },

      /**
       * Reset content to original values from YAML files.
       */
      resetContent: () => {
        const state = get();

        set({
          bio: state.originalBio,
          experience: state.originalExperience,
          education: state.originalEducation,
          hasModifiedContent: false,
          error: null,
        });
      },

      /**
       * Clear the current error message.
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: "content-store" }, // Name for DevTools
  ),
);

// ===========================================
// SELECTORS
// ===========================================

/**
 * Selector hooks for accessing specific parts of the store.
 * Using selectors prevents unnecessary re-renders.
 */

export const useBio = () => useContentStore((state) => state.bio);
export const useExperience = () => useContentStore((state) => state.experience);
export const useEducation = () => useContentStore((state) => state.education);
export const useSkills = () => useContentStore((state) => state.skills);
export const useProjects = () => useContentStore((state) => state.projects);
export const useIsLoading = () => useContentStore((state) => state.isLoading);
export const useIsRegenerating = () =>
  useContentStore((state) => state.isRegenerating);
export const useContentError = () => useContentStore((state) => state.error);
export const useHasModifiedContent = () =>
  useContentStore((state) => state.hasModifiedContent);
```

### Create Index File: `frontend/src/store/index.ts`

```typescript
// Barrel export for store
export {
  useContentStore,
  useBio,
  useExperience,
  useEducation,
  useSkills,
  useProjects,
  useIsLoading,
  useIsRegenerating,
  useContentError,
  useHasModifiedContent,
} from "./contentStore";

export { useUIStore, useActiveSection, useTheme } from "./uiStore";
```

---

## Task 2.3: Create UI Store

### What We're Doing

Creating a separate store for UI state (theme, active section, etc.).

### Create File: `frontend/src/store/uiStore.ts`

```typescript
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// ===========================================
// TYPES
// ===========================================

type Theme = "light" | "dark" | "system";

interface UIState {
  // Navigation
  activeSection: string;

  // Theme
  theme: Theme;

  // Mobile
  isMobileMenuOpen: boolean;
}

interface UIActions {
  // Navigation
  setActiveSection: (section: string) => void;
  toggleSection: (section: string) => void;
  clearActiveSection: () => void;

  // Theme
  setTheme: (theme: Theme) => void;

  // Mobile
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

type UIStore = UIState & UIActions;

// ===========================================
// INITIAL STATE
// ===========================================

const initialState: UIState = {
  activeSection: "",
  theme: "system",
  isMobileMenuOpen: false,
};

// ===========================================
// STORE IMPLEMENTATION
// ===========================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // ===========================================
        // NAVIGATION ACTIONS
        // ===========================================

        /**
         * Set the active section directly.
         */
        setActiveSection: (section: string) => {
          set({ activeSection: section });
        },

        /**
         * Toggle a section - if already active, clear it.
         * This matches the current UX behavior.
         */
        toggleSection: (section: string) => {
          set((state) => ({
            activeSection: state.activeSection === section ? "" : section,
          }));
        },

        /**
         * Clear the active section.
         */
        clearActiveSection: () => {
          set({ activeSection: "" });
        },

        // ===========================================
        // THEME ACTIONS
        // ===========================================

        /**
         * Set the theme preference.
         */
        setTheme: (theme: Theme) => {
          set({ theme });

          // Apply theme to document
          const root = document.documentElement;
          if (theme === "dark") {
            root.classList.add("dark");
          } else if (theme === "light") {
            root.classList.remove("dark");
          } else {
            // System preference
            const prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            root.classList.toggle("dark", prefersDark);
          }
        },

        // ===========================================
        // MOBILE ACTIONS
        // ===========================================

        /**
         * Toggle mobile menu visibility.
         */
        toggleMobileMenu: () => {
          set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
        },

        /**
         * Close mobile menu.
         */
        closeMobileMenu: () => {
          set({ isMobileMenuOpen: false });
        },
      }),
      {
        name: "ui-storage",
        // Only persist theme preference
        partialize: (state) => ({ theme: state.theme }),
      },
    ),
    { name: "ui-store" },
  ),
);

// ===========================================
// SELECTORS
// ===========================================

export const useActiveSection = () =>
  useUIStore((state) => state.activeSection);
export const useTheme = () => useUIStore((state) => state.theme);
export const useIsMobileMenuOpen = () =>
  useUIStore((state) => state.isMobileMenuOpen);
```

---

## Task 2.4: Split Portfolio Component

### What We're Doing

Breaking the 323-line Portfolio.tsx into 4 focused section components.

### Current Problem

**Location**: `frontend/src/components/Portfolio.tsx`

This component handles:

- Experience section (job cards)
- Education section (education cards)
- Projects section (project links + GitHub stats)
- Music section (Spotify embed)

### Create Directory Structure

```bash
mkdir -p frontend/src/components/sections/Experience
mkdir -p frontend/src/components/sections/Education
mkdir -p frontend/src/components/sections/Projects
mkdir -p frontend/src/components/sections/Music
```

### Create File: `frontend/src/components/sections/Experience/Experience.tsx`

```typescript
import { useExperience, useIsRegenerating } from '../../../store';
import { ExperienceCard } from './ExperienceCard';
import './Experience.css';

/**
 * Experience Section
 *
 * Displays work experience as a list of job cards.
 * Data comes from the content store (loaded from experience.yaml).
 */
export function Experience() {
  const experience = useExperience();
  const isRegenerating = useIsRegenerating();

  if (!experience || experience.length === 0) {
    return (
      <section className="experience-section">
        <p className="empty-state">No experience data available.</p>
      </section>
    );
  }

  return (
    <section className="experience-section">
      <h2 className="section-title">Experience</h2>

      {isRegenerating && (
        <div className="regenerating-overlay">
          <div className="spinner" />
          <p>Regenerating...</p>
        </div>
      )}

      <div className="experience-list">
        {experience.map((job, index) => (
          <ExperienceCard key={`${job.company}-${index}`} experience={job} />
        ))}
      </div>
    </section>
  );
}
```

### Create File: `frontend/src/components/sections/Experience/ExperienceCard.tsx`

```typescript
import { ExperienceItem } from '../../../types';
import './ExperienceCard.css';

interface ExperienceCardProps {
  experience: ExperienceItem;
}

/**
 * ExperienceCard
 *
 * Displays a single job experience entry with title, company,
 * period, and list of achievements.
 */
export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article className="experience-card">
      <header className="experience-header">
        <h3 className="experience-title">{experience.title}</h3>
        <p className="experience-company">{experience.company}</p>
        <p className="experience-period">{experience.period}</p>
      </header>

      {experience.achievements && experience.achievements.length > 0 && (
        <ul className="experience-achievements">
          {experience.achievements.map((achievement, index) => (
            <li key={index} className="achievement-item">
              {achievement}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
```

### Create File: `frontend/src/components/sections/Experience/Experience.css`

```css
.experience-section {
  position: relative;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.experience-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.regenerating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 2rem;
}
```

### Create File: `frontend/src/components/sections/Experience/ExperienceCard.css`

```css
.experience-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.experience-header {
  margin-bottom: 1rem;
}

.experience-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.experience-company {
  font-size: 1rem;
  color: #2563eb;
  margin: 0 0 0.25rem;
}

.experience-period {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.experience-achievements {
  margin: 0;
  padding-left: 1.25rem;
  list-style-type: disc;
}

.achievement-item {
  font-size: 0.9375rem;
  color: #475569;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.achievement-item:last-child {
  margin-bottom: 0;
}
```

### Create File: `frontend/src/components/sections/Experience/index.ts`

```typescript
export { Experience } from "./Experience";
export { ExperienceCard } from "./ExperienceCard";
```

### Create File: `frontend/src/components/sections/Education/Education.tsx`

```typescript
import { useEducation, useIsRegenerating } from '../../../store';
import { EducationCard } from './EducationCard';
import './Education.css';

/**
 * Education Section
 *
 * Displays educational background as a grid of cards.
 * Data comes from the content store (loaded from education.yaml).
 */
export function Education() {
  const education = useEducation();
  const isRegenerating = useIsRegenerating();

  if (!education || education.length === 0) {
    return (
      <section className="education-section">
        <p className="empty-state">No education data available.</p>
      </section>
    );
  }

  return (
    <section className="education-section">
      <h2 className="section-title">Education</h2>

      {isRegenerating && (
        <div className="regenerating-overlay">
          <div className="spinner" />
          <p>Regenerating...</p>
        </div>
      )}

      <div className="education-grid">
        {education.map((edu, index) => (
          <EducationCard key={`${edu.school}-${index}`} education={edu} />
        ))}
      </div>
    </section>
  );
}
```

### Create File: `frontend/src/components/sections/Education/EducationCard.tsx`

```typescript
import { EducationItem } from '../../../types';
import './EducationCard.css';

interface EducationCardProps {
  education: EducationItem;
}

/**
 * EducationCard
 *
 * Displays a single education entry with school, degree, and year.
 */
export function EducationCard({ education }: EducationCardProps) {
  return (
    <article className="education-card">
      <h3 className="education-school">{education.school}</h3>
      <p className="education-degree">{education.degree}</p>
      <p className="education-year">{education.year}</p>
    </article>
  );
}
```

### Create File: `frontend/src/components/sections/Education/Education.css`

```css
.education-section {
  position: relative;
}

.education-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .education-grid {
    grid-template-columns: 1fr;
  }
}
```

### Create File: `frontend/src/components/sections/Education/EducationCard.css`

```css
.education-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  text-align: center;
}

.education-school {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.education-degree {
  font-size: 1rem;
  color: #475569;
  margin: 0 0 0.25rem;
}

.education-year {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}
```

### Create File: `frontend/src/components/sections/Education/index.ts`

```typescript
export { Education } from "./Education";
export { EducationCard } from "./EducationCard";
```

### Create File: `frontend/src/components/sections/Projects/Projects.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useProjects } from '../../../store';
import { ProjectCard } from './ProjectCard';
import { GitHubStats } from './GitHubStats';
import './Projects.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.crog.gg';

interface LanguageStats {
  [language: string]: number;
}

/**
 * Projects Section
 *
 * Displays project cards and GitHub language statistics.
 * GitHub stats are fetched lazily when the section is shown.
 */
export function Projects() {
  const projects = useProjects();
  const [languageStats, setLanguageStats] = useState<LanguageStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch GitHub stats when component mounts
  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`${API_URL}/api/github/languages`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setLanguageStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stats:', error);
        // Non-critical, don't show error to user
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchGitHubStats();
  }, []);

  if (!projects || projects.length === 0) {
    return (
      <section className="projects-section">
        <p className="empty-state">No projects available.</p>
      </section>
    );
  }

  return (
    <section className="projects-section">
      <h2 className="section-title">Projects</h2>

      {/* GitHub Language Statistics */}
      <GitHubStats stats={languageStats} isLoading={isLoadingStats} />

      {/* Project Cards */}
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
```

### Create File: `frontend/src/components/sections/Projects/ProjectCard.tsx`

```typescript
import { Project } from '../../../types';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
}

/**
 * ProjectCard
 *
 * Displays a single project with title, description, and link.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-card"
    >
      <div className="project-icon">{project.icon || '📁'}</div>
      <div className="project-content">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        {project.technologies && project.technologies.length > 0 && (
          <div className="project-technologies">
            {project.technologies.map((tech) => (
              <span key={tech} className="technology-tag">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
```

### Create File: `frontend/src/components/sections/Projects/GitHubStats.tsx`

```typescript
import './GitHubStats.css';

interface GitHubStatsProps {
  stats: { [language: string]: number } | null;
  isLoading: boolean;
}

/**
 * GitHubStats
 *
 * Displays GitHub language statistics as a horizontal bar chart.
 */
export function GitHubStats({ stats, isLoading }: GitHubStatsProps) {
  if (isLoading) {
    return (
      <div className="github-stats loading">
        <div className="spinner" />
        <p>Loading GitHub statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate total bytes
  const total = Object.values(stats).reduce((sum, bytes) => sum + bytes, 0);

  if (total === 0) {
    return null;
  }

  // Sort by bytes and take top languages
  const sortedLanguages = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Color map for common languages
  const languageColors: { [key: string]: string } = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
    C: '#555555',
    'C++': '#f34b7d',
  };

  return (
    <div className="github-stats">
      <h3 className="stats-title">GitHub Languages</h3>

      {/* Bar chart */}
      <div className="language-bar">
        {sortedLanguages.map(([language, bytes]) => {
          const percentage = (bytes / total) * 100;
          return (
            <div
              key={language}
              className="language-segment"
              style={{
                width: `${percentage}%`,
                backgroundColor: languageColors[language] || '#8b8b8b',
              }}
              title={`${language}: ${percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="language-legend">
        {sortedLanguages.map(([language, bytes]) => {
          const percentage = (bytes / total) * 100;
          return (
            <div key={language} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: languageColors[language] || '#8b8b8b' }}
              />
              <span className="legend-label">{language}</span>
              <span className="legend-percentage">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Create CSS Files for Projects

Create `Projects.css`, `ProjectCard.css`, and `GitHubStats.css` with appropriate styles (similar pattern to Experience/Education).

### Create File: `frontend/src/components/sections/Projects/index.ts`

```typescript
export { Projects } from "./Projects";
export { ProjectCard } from "./ProjectCard";
export { GitHubStats } from "./GitHubStats";
```

### Create File: `frontend/src/components/sections/Music/Music.tsx`

```typescript
import { useBio } from '../../../store';
import './Music.css';

/**
 * Music Section
 *
 * Displays music links and Spotify embed.
 * Links come from the bio social_links.
 */
export function Music() {
  const bio = useBio();

  return (
    <section className="music-section">
      <h2 className="section-title">Music</h2>

      <div className="music-content">
        <p className="music-description">
          When I'm not coding, I make music. Check out my work:
        </p>

        <div className="music-links">
          {bio?.social_links.spotify && (
            <a
              href={bio.social_links.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="music-link spotify"
            >
              🎵 Spotify
            </a>
          )}
          {bio?.social_links.hoobe && (
            <a
              href={bio.social_links.hoobe}
              target="_blank"
              rel="noopener noreferrer"
              className="music-link hoobe"
            >
              🎹 Hoobe
            </a>
          )}
        </div>

        {/* Spotify Embed */}
        {bio?.social_links.spotify && (
          <div className="spotify-embed">
            <iframe
              src="https://open.spotify.com/embed/artist/YOUR_ARTIST_ID"
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          </div>
        )}
      </div>
    </section>
  );
}
```

### Create File: `frontend/src/components/sections/Music/index.ts`

```typescript
export { Music } from "./Music";
```

### Create Sections Barrel Export: `frontend/src/components/sections/index.ts`

```typescript
export { Experience } from "./Experience";
export { Education } from "./Education";
export { Projects } from "./Projects";
export { Music } from "./Music";
```

---

## Task 2.5: Extract Layout Components

### What We're Doing

Creating reusable layout components for the header and page structure.

### Create Directory Structure

```bash
mkdir -p frontend/src/components/layout/Header
mkdir -p frontend/src/components/layout/PageContainer
```

### Create File: `frontend/src/components/layout/Header/Header.tsx`

```typescript
import { useBio } from '../../../store';
import { Typewriter } from '../../Typewriter';
import { SocialLinks } from './SocialLinks';
import './Header.css';

/**
 * Header Component
 *
 * Displays the profile photo, name, contact info, social links,
 * and welcome message with typewriter effect.
 */
export function Header() {
  const bio = useBio();

  if (!bio) {
    return (
      <header className="header">
        <div className="header-loading">Loading...</div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="profile-section">
        <img
          src="/headshot.png"
          alt={`${bio.display_name} headshot`}
          className="profile-photo"
        />

        <div className="profile-info">
          <h1 className="profile-name">{bio.display_name}</h1>
          <p className="profile-location">📍 {bio.location}</p>
          <p className="profile-email">📧 {bio.email}</p>

          <SocialLinks links={bio.social_links} />
        </div>
      </div>

      <div className="welcome-message">
        <Typewriter text={bio.welcome_message} speed={30} delay={500} />
      </div>
    </header>
  );
}
```

### Create File: `frontend/src/components/layout/Header/SocialLinks.tsx`

```typescript
import { BioData } from '../../../types';
import './SocialLinks.css';

interface SocialLinksProps {
  links: BioData['social_links'];
}

/**
 * SocialLinks Component
 *
 * Displays social media links as a horizontal list.
 */
export function SocialLinks({ links }: SocialLinksProps) {
  return (
    <nav className="social-links" aria-label="Social links">
      {links.github && (
        <a
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          GitHub
        </a>
      )}
      {links.linkedin && (
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          LinkedIn
        </a>
      )}
      {links.spotify && (
        <a
          href={links.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          Spotify
        </a>
      )}
      {links.hoobe && (
        <a
          href={links.hoobe}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          Hoobe
        </a>
      )}
    </nav>
  );
}
```

### Create Index Files and CSS

Follow the same pattern as previous components.

---

## Task 2.6: Create Custom Hooks

### What We're Doing

Creating custom hooks to encapsulate common logic patterns.

### Create Directory

```bash
mkdir -p frontend/src/hooks
```

### Create File: `frontend/src/hooks/useContentLoader.ts`

```typescript
import { useEffect } from "react";
import { useContentStore } from "../store";

/**
 * Hook to load content on component mount.
 *
 * This hook should be called once at the app root level
 * to initialize the content store from YAML files.
 *
 * @example
 * function App() {
 *   useContentLoader();
 *   // ... rest of app
 * }
 */
export function useContentLoader() {
  const loadContent = useContentStore((state) => state.loadContent);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return { isLoading, error };
}
```

### Create File: `frontend/src/hooks/useRegeneration.ts`

```typescript
import { useCallback } from "react";
import { useContentStore, useUIStore } from "../store";

/**
 * Hook for content regeneration functionality.
 *
 * Provides handlers for regenerating and resetting content,
 * along with relevant state.
 *
 * @example
 * function RegenerateButton() {
 *   const { regenerate, reset, isRegenerating, hasModifiedContent } = useRegeneration();
 *
 *   return (
 *     <button onClick={() => regenerate(false)} disabled={isRegenerating}>
 *       Regenerate
 *     </button>
 *   );
 * }
 */
export function useRegeneration() {
  const regenerateContent = useContentStore((state) => state.regenerateContent);
  const resetContent = useContentStore((state) => state.resetContent);
  const isRegenerating = useContentStore((state) => state.isRegenerating);
  const hasModifiedContent = useContentStore(
    (state) => state.hasModifiedContent,
  );
  const activeSection = useUIStore((state) => state.activeSection);

  const regenerate = useCallback(
    (useFantasy: boolean = false) => {
      if (activeSection) {
        regenerateContent(activeSection, useFantasy);
      }
    },
    [activeSection, regenerateContent],
  );

  const reset = useCallback(() => {
    resetContent();
  }, [resetContent]);

  return {
    regenerate,
    reset,
    isRegenerating,
    hasModifiedContent,
    activeSection,
  };
}
```

### Create File: `frontend/src/hooks/useScrollToSection.ts`

```typescript
import { useRef, useCallback } from "react";

/**
 * Hook for smooth scrolling to section content.
 *
 * Returns a ref to attach to the content container and
 * a function to trigger scrolling.
 *
 * @example
 * function Page() {
 *   const { contentRef, scrollToContent } = useScrollToSection();
 *
 *   return (
 *     <div>
 *       <button onClick={scrollToContent}>Go to content</button>
 *       <main ref={contentRef}>Content here</main>
 *     </div>
 *   );
 * }
 */
export function useScrollToSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstInteraction = useRef(true);

  const scrollToContent = useCallback(() => {
    // Don't scroll on first interaction (page load)
    if (isFirstInteraction.current) {
      isFirstInteraction.current = false;
      return;
    }

    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return { contentRef, scrollToContent };
}
```

### Create File: `frontend/src/hooks/index.ts`

```typescript
export { useContentLoader } from "./useContentLoader";
export { useRegeneration } from "./useRegeneration";
export { useScrollToSection } from "./useScrollToSection";
```

---

## Task 2.7: Update HomePage to Use Stores

### What We're Doing

Refactoring HomePage to use Zustand stores instead of local state.

### Update File: `frontend/src/pages/Home/HomePage.tsx`

```typescript
import { CSSTransition } from 'react-transition-group';

// Hooks
import { useContentLoader, useRegeneration, useScrollToSection } from '../../hooks';
import { useUIStore, useIsLoading, useContentError } from '../../store';

// Layout Components
import { Header } from '../../components/layout/Header';

// Section Components
import { About } from '../../components/About';
import { Skills } from '../../components/Skills';
import { Experience, Education, Projects, Music } from '../../components/sections';
import { SectionNav } from '../../components/SectionNav';
import { ActionButtons } from '../../components/ActionButtons';

// Styles
import '../../App.css';
import '../../styles/transitions.css';

/**
 * HomePage - Main portfolio landing page (Refactored)
 *
 * Now uses Zustand stores for state management instead of
 * local state and CustomEvents.
 */
export function HomePage() {
  // Load content on mount
  useContentLoader();

  // Get state from stores
  const isLoading = useIsLoading();
  const error = useContentError();
  const activeSection = useUIStore((state) => state.activeSection);
  const toggleSection = useUIStore((state) => state.toggleSection);

  // Regeneration functionality
  const { regenerate, reset, isRegenerating, hasModifiedContent } = useRegeneration();

  // Scroll behavior
  const { contentRef, scrollToContent } = useScrollToSection();

  // Handle section change with scroll
  const handleSectionChange = (section: string) => {
    toggleSection(section);
    scrollToContent();
  };

  // Render section based on active selection
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'about':
        return <About />;
      case 'skills':
        return <Skills />;
      case 'experience':
        return <Experience />;
      case 'education':
        return <Education />;
      case 'projects':
        return <Projects />;
      case 'music':
        return <Music />;
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="app loading-state">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app error-state">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <SectionNav
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main ref={contentRef} className="main-content">
        <CSSTransition
          in={!!activeSection}
          timeout={300}
          classNames="section"
          unmountOnExit
        >
          <div className="section-container">
            {renderActiveSection()}
          </div>
        </CSSTransition>
      </main>

      {activeSection && (
        <ActionButtons
          onRegenerate={regenerate}
          onReset={reset}
          isRegenerating={isRegenerating}
          hasModifiedContent={hasModifiedContent}
          activeSection={activeSection}
        />
      )}
    </div>
  );
}
```

---

## Task 2.8: Remove CustomEvent Pattern

### What We're Doing

Removing the CustomEvent listeners now that we have Zustand.

### Files to Update

1. **About.tsx**: Remove the `contentRegenerated` event listener

```typescript
// BEFORE (with CustomEvent)
useEffect(() => {
  const handleContentRegenerated = (event: CustomEvent) => {
    if (event.detail.section === 'about') {
      setDisplayText(event.detail.content.about_text);
    }
  };
  window.addEventListener('contentRegenerated', handleContentRegenerated);
  return () => window.removeEventListener(...);
}, []);

// AFTER (with Zustand)
import { useBio, useIsRegenerating } from '../store';

export function About() {
  const bio = useBio();
  const isRegenerating = useIsRegenerating();

  // No event listeners needed - component re-renders when store changes
  return (
    <section className="about-section">
      {isRegenerating && <LoadingOverlay />}
      <p>{bio?.about_text}</p>
    </section>
  );
}
```

2. **Remove all `window.dispatchEvent(new CustomEvent(...))` calls** from the codebase

3. **Search and verify**: `grep -r "CustomEvent" src/` should return no results

---

## Verification Checklist

### Functionality Tests

- [ ] **Content loads**: Bio, experience, education, skills, projects all load
- [ ] **Sections render**: Each section displays correctly when selected
- [ ] **Regeneration works**: API calls succeed and content updates
- [ ] **Reset works**: Content resets to original values
- [ ] **No event errors**: No CustomEvent-related errors in console

### Architecture Tests

- [ ] **No CustomEvents**: `grep -r "CustomEvent" src/` returns nothing
- [ ] **Store works**: Redux DevTools shows store updates
- [ ] **Components isolated**: Each section component is self-contained

### Code Quality

- [ ] **TypeScript passes**: `npm run build` succeeds
- [ ] **ESLint passes**: `npm run lint` shows no errors
- [ ] **No prop drilling**: Components use stores directly

### File Count Verification

New files created in Phase 2:

- [ ] `store/contentStore.ts`
- [ ] `store/uiStore.ts`
- [ ] `store/index.ts`
- [ ] `components/sections/Experience/*` (4 files)
- [ ] `components/sections/Education/*` (4 files)
- [ ] `components/sections/Projects/*` (5 files)
- [ ] `components/sections/Music/*` (2 files)
- [ ] `components/layout/Header/*` (4 files)
- [ ] `hooks/*` (4 files)

---

## Common Issues

### Issue: "Cannot find module '../store'"

**Cause**: Store barrel export not set up correctly.

**Solution**: Verify `store/index.ts` exports all stores and selectors.

### Issue: Component not re-rendering when store changes

**Cause**: Not using selector correctly.

**Solution**: Use selector function to subscribe to specific state:

```typescript
// Wrong - subscribes to entire store
const store = useContentStore();

// Right - only subscribes to bio
const bio = useContentStore((state) => state.bio);
```

### Issue: "Maximum update depth exceeded"

**Cause**: Action being called during render.

**Solution**: Wrap action calls in event handlers or useEffect:

```typescript
// Wrong
loadContent(); // Called during render

// Right
useEffect(() => {
  loadContent();
}, []);
```

---

## Next Steps

After completing Phase 2:

1. **Commit your changes**:

   ```bash
   git add .
   git commit -m "Phase 2: Implement Zustand stores and split components"
   ```

2. **Proceed to Phase 3**: [05-phase-3-extensibility.md](./05-phase-3-extensibility.md)

---

_Document Version: 1.0.0_
_Last Updated: January 2026_
