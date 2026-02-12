# Phase 05: Project Showcase Upgrade

**PR Title:** Upgrade project showcase with featured hierarchy, images, and richer cards
**Risk Level:** Low
**Estimated Effort:** Medium (4-6 hours)

## Files Modified

| Action   | File                                                        |
| -------- | ----------------------------------------------------------- |
| Modified | `frontend/public/content/projects/shuffify.yaml`            |
| Modified | `frontend/public/content/projects/city-cycles.yaml`         |
| Modified | `frontend/public/content/projects/storyline-ai.yaml`        |
| Modified | `frontend/public/content/projects/30-day-abs.yaml`          |
| Modified | `frontend/public/content/projects/shitpost-alpha.yaml`      |
| Modified | `frontend/public/content/projects/github.yaml`              |
| Modified | `frontend/src/components/Portfolio.tsx`                     |
| Created  | `frontend/src/components/sections/Projects/ProjectCard.tsx` |
| Created  | `frontend/src/components/sections/Projects/ProjectCard.css` |

## Context

The user's 10/10 criterion is "projects come alive." Currently:

- All 7 projects get identical card treatment (same size, same layout)
- Zero project images despite the `image` field existing in the Project type
- The `featured` boolean exists in the type but is never used in UI
- Project cards are plain links with icon + text, no visual hierarchy
- Some projects have inconsistent/missing YAML fields

This phase makes featured projects visually prominent, adds placeholder gradient images, and creates richer cards with tech stack pills and status badges.

## Dependencies

- **Depends on:** Nothing (can run in parallel with Phases 03, 04, 06)
- **Unlocks:** Phase 07 (mobile nav should account for improved project cards)

## Detailed Implementation Plan

### Step 1: Fix and enhance project YAML files

Audit and normalize all project YAML files. Key changes:

- Ensure all projects have `id` field
- Mark top projects as `featured: true`
- Add `gradient` field for placeholder images (CSS gradient string)
- Normalize descriptions to be concise

**File:** `frontend/public/content/projects/shuffify.yaml`

**After (complete file):**

```yaml
# Shuffify - Spotify Playlist Manager
id: shuffify
title: Shuffify
description: |
  a better way to manage your spotify playlists with advanced
  filtering, organization, and discovery features.
url: https://shuffify.app
icon: fas fa-music
category: web-app
technologies:
  - React
  - TypeScript
  - Spotify API
  - Node.js
featured: true
order: 1
status: active
gradient: "linear-gradient(135deg, #1DB954 0%, #191414 100%)"
tags:
  - music
  - spotify
  - playlist-management
  - web-app
```

**File:** `frontend/public/content/projects/city-cycles.yaml`

Read the current file first, then update:

**After (complete file):**

```yaml
# City Cycles - Bike Share Analytics
id: city-cycles
title: City Cycles
description: |
  interactive analytics dashboard for nyc and london bike share data
  with route mapping and usage patterns.
url: https://github.com/chrisrogers37/city-cycles
icon: fas fa-bicycle
category: data-viz
technologies:
  - Python
  - Pandas
  - Plotly
  - Streamlit
featured: true
order: 2
status: active
gradient: "linear-gradient(135deg, #3B82F6 0%, #1E3A5F 100%)"
tags:
  - data-viz
  - analytics
  - bike-share
```

**File:** `frontend/public/content/projects/storyline-ai.yaml`

**After (complete file):**

```yaml
# Storyline AI - AI Narrative Tools
id: storyline-ai
title: Storyline AI
description: |
  ai-powered narrative generation tools for creative writing
  and interactive storytelling.
url: https://github.com/chrisrogers37/storyline-ai
icon: fas fa-book
category: ai
technologies:
  - Python
  - OpenAI API
  - React
  - TypeScript
featured: true
order: 3
status: experimental
gradient: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)"
tags:
  - ai
  - creative-writing
  - storytelling
```

**File:** `frontend/public/content/projects/30-day-abs.yaml`

**After (complete file):**

```yaml
# 30 Day Abs - Fitness App
id: 30-day-abs
title: 30 Day Abs
description: |
  a structured 30-day fitness program with daily workouts
  and progress tracking.
url: https://github.com/chrisrogers37/30-day-abs
icon: fas fa-dumbbell
category: mobile-app
technologies:
  - React Native
  - TypeScript
featured: false
order: 4
status: archived
gradient: "linear-gradient(135deg, #EF4444 0%, #991B1B 100%)"
tags:
  - fitness
  - mobile
  - health
```

**File:** `frontend/public/content/projects/shitpost-alpha.yaml`

**After (complete file):**

```yaml
# Shitpost Alpha - Creative Project
id: shitpost-alpha
title: Shitpost Alpha
description: |
  experimental creative coding project exploring generative
  content and internet culture.
url: https://github.com/chrisrogers37/shitpost-alpha
icon: fas fa-fire
category: creative
technologies:
  - JavaScript
  - Canvas API
featured: false
order: 5
status: experimental
gradient: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)"
tags:
  - creative
  - experimental
```

**File:** `frontend/public/content/projects/github.yaml`

**After (complete file):**

```yaml
# GitHub - Open Source Portfolio
id: github
title: Open Source
description: |
  check out all my public repos, contributions, and open source work.
url: https://github.com/chrisrogers37
icon: fab fa-github
category: portfolio
technologies:
  - Python
  - TypeScript
  - React
featured: false
order: 6
status: active
gradient: "linear-gradient(135deg, #6B7280 0%, #1F2937 100%)"
tags:
  - open-source
  - portfolio
```

### Step 2: Create ProjectCard component

**File:** `frontend/src/components/sections/Projects/ProjectCard.tsx` (NEW)

```tsx
import { Project } from "../../../types/Project";
import "./ProjectCard.css";

type ProjectCardProps = {
  project: Project;
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const statusColors: Record<string, string> = {
    active: "#10B981",
    experimental: "#F59E0B",
    archived: "#6B7280",
  };

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`project-card ${featured ? "project-card-featured" : ""}`}
    >
      {/* Gradient placeholder image */}
      <div
        className="project-card-image"
        style={{
          background:
            (project as Project & { gradient?: string }).gradient ||
            "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
        }}
      >
        <i className={`${project.icon} project-card-icon`} />
      </div>

      <div className="project-card-body">
        <div className="project-card-header">
          <h4 className="project-card-title">{project.title}</h4>
          {project.status && (
            <span
              className="project-card-status"
              style={{
                color: statusColors[project.status] || "#6B7280",
                borderColor: statusColors[project.status] || "#6B7280",
              }}
            >
              {project.status}
            </span>
          )}
        </div>

        <p className="project-card-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <div className="project-card-tech">
            {project.technologies.map((tech, i) => (
              <span key={i} className="project-card-tech-pill">
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

### Step 3: Create ProjectCard styles

**File:** `frontend/src/components/sections/Projects/ProjectCard.css` (NEW)

```css
.project-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  background: var(--card-background);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Featured cards span 2 columns */
.project-card-featured {
  grid-column: span 2;
}

/* Gradient image placeholder */
.project-card-image {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.project-card-featured .project-card-image {
  height: 160px;
}

.project-card-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Card body */
.project-card-body {
  padding: 1rem;
}

.project-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.project-card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.project-card-status {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border: 1px solid;
  border-radius: 9999px;
  text-transform: lowercase;
}

.project-card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.project-card-tech-pill {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--border-color);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .project-card-featured {
    grid-column: span 1;
  }
}
```

### Step 4: Update Portfolio.tsx to use ProjectCard and featured hierarchy

**File:** `frontend/src/components/Portfolio.tsx`

In the `renderSection` function, update the `case "projects"` block (around line 194).

**Before (lines 194-265):** The existing projects rendering with `.links-grid` and `.portfolio-link`

**After:** Replace the entire `case "projects"` return with:

```tsx
        case "projects":
          return (
            <div className="projects-section">
              {loadingProjects && (
                <div className="loading-message">Loading projects...</div>
              )}
              {!loadingProjects && projects.length > 0 && (
                <>
                  {/* Featured Projects */}
                  {projects.filter((p) => p.featured).length > 0 && (
                    <div className="projects-grid">
                      {projects
                        .filter((p) => p.featured)
                        .sort((a, b) => a.order - b.order)
                        .map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            featured
                          />
                        ))}
                    </div>
                  )}

                  {/* Other Projects */}
                  {projects.filter((p) => !p.featured && p.id !== "github")
                    .length > 0 && (
                    <>
                      <h4 className="projects-other-heading">other projects</h4>
                      <div className="projects-grid">
                        {projects
                          .filter((p) => !p.featured && p.id !== "github")
                          .sort((a, b) => a.order - b.order)
                          .map((project) => (
                            <ProjectCard key={project.id} project={project} />
                          ))}
                      </div>
                    </>
                  )}

                  {/* GitHub link */}
                  {projects.find((p) => p.id === "github") && (
                    <div className="github-project-section">
                      <ProjectCard
                        project={projects.find((p) => p.id === "github")!}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Language stats section remains unchanged */}
              <div className="github-stats-container">
                {/* ... existing language stats code stays the same ... */}
              </div>
            </div>
          );
```

**Add import** at the top of Portfolio.tsx:

```typescript
import { ProjectCard } from "./sections/Projects/ProjectCard";
```

**Add CSS for the new grid** in the same file's styles or in a new CSS import. Add to `frontend/src/App.css` or a new file:

```css
.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.projects-other-heading {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 1.5rem 0 0.75rem;
  text-transform: lowercase;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
```

### Step 5: Update Project type to include gradient

**File:** `frontend/src/types/Project.ts`

**Before:**

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  technologies: string[];
  featured: boolean;
  order: number;
  image?: string;
  github?: string;
  demo?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}
```

**After:**

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  technologies: string[];
  featured: boolean;
  order: number;
  image?: string;
  gradient?: string;
  github?: string;
  demo?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}
```

## Test Plan

### Unit Test

Create `frontend/src/components/sections/Projects/__tests__/ProjectCard.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProjectCard } from "../ProjectCard";

const mockProject = {
  id: "test",
  title: "Test Project",
  description: "A test project",
  url: "https://example.com",
  icon: "fas fa-code",
  category: "web-app",
  technologies: ["React", "TypeScript"],
  featured: false,
  order: 1,
  status: "active" as const,
  gradient: "linear-gradient(135deg, #000 0%, #333 100%)",
};

describe("ProjectCard", () => {
  it("renders project title and description", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project")).toBeInTheDocument();
  });

  it("renders technology pills", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("applies featured class when featured prop is true", () => {
    const { container } = render(
      <ProjectCard project={mockProject} featured />
    );
    expect(container.firstChild).toHaveClass("project-card-featured");
  });

  it("renders status badge", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
```

### E2E Test

Update `frontend/e2e/home.spec.ts`:

```typescript
test("projects section shows featured projects", async ({ page }) => {
  await page.locator('button[data-section="projects"]').click();
  const cards = page.locator(".project-card");
  await expect(cards.first()).toBeVisible({ timeout: 5000 });

  // Featured cards should exist
  const featured = page.locator(".project-card-featured");
  const count = await featured.count();
  expect(count).toBeGreaterThan(0);
});
```

## Documentation Updates

- Project YAML files now have optional `gradient` field for placeholder images
- Project type includes `gradient?: string`

## Edge Cases

1. **No featured projects:** Grid renders all projects at equal size (no `.project-card-featured` class)
2. **Missing gradient:** Falls back to gray gradient in ProjectCard component
3. **Missing status:** Status badge doesn't render (conditional check)
4. **Empty technologies array:** Tech pills section doesn't render
5. **Very long description:** Clamped to 2 lines with CSS `-webkit-line-clamp`

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] Featured projects (Shuffify, City Cycles, Storyline AI) appear larger (2-column span)
- [ ] Non-featured projects appear in normal grid
- [ ] Gradient placeholders render for each project
- [ ] Tech stack pills visible on each card
- [ ] Status badges show (active/experimental/archived)
- [ ] Cards have hover lift effect
- [ ] GitHub "Open Source" card appears separately at bottom
- [ ] Mobile: all cards single column
- [ ] Dark mode rendering correct

## What NOT To Do

- **Don't add real screenshots yet** - gradient placeholders are the plan; real images are a content task
- **Don't change the project detail page routing** - `/projects/:slug` stays the same
- **Don't remove any existing project data** - only add/normalize fields
- **Don't use em-dashes** in descriptions
- **Don't reorder projects arbitrarily** - use the `order` field
