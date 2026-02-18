# Phase 05: Projects Grid Tiles Redesign

**Status:** 🔧 IN PROGRESS
**Started:** 2026-02-17

**PR Title:** `feat: redesign projects display as compact visual tile grid`
**Risk Level:** Medium (touches multiple components across two pages)
**Estimated Effort:** Medium (2-3 hours)
**Files Modified:** 5 | **Files Created:** 0 | **Files Deleted:** 0

---

## Context

The user wants projects displayed as a compact tile grid instead of the current vertical list layout. The goal is to let visitors see ALL projects at a glance without scrolling, with enough visual richness (gradients, icons, titles, short descriptions) to be impressive. Think dashboard of work, not a scrolling feed.

**User's design intent:** Playful but professional through being impressive. Target audience is recruiters, colleagues, collaborators. Inspired by Karpathy.ai's minimal/sleek approach but more visual.

**Current state:**

- **Home page Projects section** (`frontend/src/components/sections/Projects/Projects.tsx`): 2-column grid with featured cards spanning full width + separate "Other Projects" section + special GitHub section. CSS at `Projects.css`, card component at `ProjectCard.tsx`.
- **Projects page** (`frontend/src/pages/Projects/ProjectsPage.tsx`): Horizontal list cards with icon-left, text-center, arrow-right layout. Has search + category filter. CSS at `ProjectsPage.css`.

**Available data per project:** title, description, icon (Font Awesome class), gradient (CSS gradient string), category, technologies array, featured boolean, status, tags array, url, github, demo.

**Project count:** 7 projects (after Phase 02 adds Dead Redux).

**Screenshot references:**

- `/tmp/design-review/home-desktop.png` - current home layout
- `/tmp/design-review/projects-desktop.png` - current projects page
- `/tmp/design-review/projects-mobile.png` - current mobile layout

---

## Dependencies

- **Depends on Phase 02** (project ordering + Dead Redux) so the grid shows the correct projects in the right order.
- Phase 06 depends on this phase completing first.

---

## Visual Specification

### Target Design: Compact Tile

Each project tile is a compact card:

```
+----------------------------+
|  ########################  |  <- Gradient background (80px height)
|  #### ICON ##############  |  <- Font Awesome icon, white, 1.5rem, centered
|  ########################  |
+----------------------------+
|  Project Title             |  <- Bold, 0.95rem, dark text
|  Short description that    |  <- 0.8rem, gray text, 2-line clamp
|  wraps to two lines...     |
|                            |
|  [TS] [React] [API]       |  <- Tech pills, 0.65rem, max 3 shown + "+N"
+----------------------------+
```

### Grid Layout

**Desktop (1440px):** 3 columns, gap: 1rem

```
[  Tile  ] [  Tile  ] [  Tile  ]
[  Tile  ] [  Tile  ] [  Tile  ]
[  Tile  ]
```

**Tablet (768px):** 2 columns, gap: 1rem
**Mobile (375px):** 2 columns, gap: 0.75rem (tiles stay compact, NOT full-width)

Key insight: even on mobile, use 2 columns. Tiles should be small enough (approximately 160-180px wide) that 2 fit side-by-side. This is what makes it feel like a dashboard/grid rather than a list.

### No Featured Distinction

Remove the concept of "featured" projects spanning full width. All tiles are the same size. Ordering (Phase 02) handles prominence - best projects first.

### GitHub Tile (Special)

The GitHub profile tile uses its own gradient (already defined as gray-to-dark: `linear-gradient(135deg, #6B7280 0%, #1F2937 100%)`) with the GitHub icon. No special treatment needed - it's just another tile rendered last due to `order: 99`.

### Hover State

- `transform: translateY(-2px)` + `box-shadow: 0 8px 25px rgba(0,0,0,0.1)`
- Transition: `transform 0.2s ease, box-shadow 0.2s ease`

### Click Behavior

- **Home page tiles:** Link to the project URL (external, opens in new tab) - same as current behavior
- **`/projects` page tiles:** Link to `/projects/{project.id}` (internal detail page) - same as current behavior

---

## Detailed Implementation Plan

### Step 1: Redesign ProjectCard.tsx as compact tile

**File:** `frontend/src/components/sections/Projects/ProjectCard.tsx`

Read the current file. Replace the card layout with a compact tile design.

**New props interface:**

```typescript
type ProjectCardProps = {
  project: Project;
  linkTo?: string; // If provided, uses React Router Link (internal). Otherwise uses <a> (external).
};
```

**New JSX structure:**

```tsx
import { Link } from "react-router-dom";
import { Project } from "../../../types";
import "./Projects.css";

type ProjectCardProps = {
  project: Project;
  linkTo?: string;
};

export function ProjectCard({ project, linkTo }: ProjectCardProps) {
  const content = (
    <>
      <div
        className="project-tile-header"
        style={{
          background:
            project.gradient ||
            "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
        }}
      >
        {project.icon && <i className={`${project.icon} project-tile-icon`} />}
      </div>
      <div className="project-tile-body">
        <h3 className="project-tile-title">{project.title}</h3>
        <p className="project-tile-description">{project.description}</p>
        <div className="project-tile-tech">
          {project.technologies.slice(0, 3).map((tech) => (
            <span key={tech} className="project-tile-tech-pill">
              {tech}
            </span>
          ))}
          {project.technologies.length > 3 && (
            <span className="project-tile-tech-pill project-tile-tech-more">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="project-tile">
        {content}
      </Link>
    );
  }

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-tile"
    >
      {content}
    </a>
  );
}
```

**Key changes from current:**

- Removed `featured` prop - all tiles are equal size
- Added `linkTo` prop for internal navigation on /projects page
- Removed status badge from card (simplifies the tile)
- Tech pills limited to 3 with "+N" overflow indicator
- New class names: `project-tile`, `project-tile-header`, `project-tile-body`, etc.

### Step 2: Update Projects.css with tile styles

**File:** `frontend/src/components/sections/Projects/Projects.css`

Replace the existing card styles with new tile styles. Keep any non-card styles (section wrapper, heading) intact.

**New/replacement CSS:**

```css
/* Projects Section */
.projects-section {
  padding: 0;
}

/* Tile Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* Individual Tile */
.project-tile {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.project-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Tile Header (gradient + icon) */
.project-tile-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-tile-icon {
  font-size: 1.5rem;
  color: white;
  opacity: 0.9;
}

/* Tile Body */
.project-tile-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.project-tile-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.project-tile-description {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tech Pills */
.project-tile-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.project-tile-tech-pill {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  white-space: nowrap;
}

.project-tile-tech-more {
  background: #e2e8f0;
  color: #64748b;
}

/* Dark Mode */
.dark .project-tile {
  background: #1e293b;
  border-color: #334155;
}

.dark .project-tile:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.dark .project-tile-title {
  color: #f1f5f9;
}

.dark .project-tile-description {
  color: #94a3b8;
}

.dark .project-tile-tech-pill {
  background: #334155;
  color: #94a3b8;
}

.dark .project-tile-tech-more {
  background: #475569;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .project-tile-header {
    height: 60px;
  }

  .project-tile-body {
    padding: 0.5rem;
  }

  .project-tile-title {
    font-size: 0.85rem;
  }

  .project-tile-description {
    font-size: 0.75rem;
  }

  .project-tile-tech-pill {
    font-size: 0.6rem;
  }
}
```

**Remove these old CSS classes** (no longer used):

- `.project-card`, `.project-card-featured`, `.project-card-image`, `.project-card-body`
- `.project-card-header`, `.project-card-title`, `.project-card-status`
- `.project-card-description`, `.project-card-tech`, `.project-card-tech-pill`
- `.project-card-icon`
- `.projects-other-heading`

### Step 3: Simplify Projects.tsx (Home Page Section)

**File:** `frontend/src/components/sections/Projects/Projects.tsx`

Read the current file. Simplify it to render all projects as equal tiles in one grid.

**Key changes:**

1. Remove the split between featured and other projects
2. Remove the "Other Projects" heading
3. Remove the special GitHub section at the bottom
4. Render ALL projects (including GitHub) as tiles in one `.projects-grid`
5. Remove the GitHub language stats fetching (simplifies the component - language stats are still available on the detail page)

**Simplified structure:**

```tsx
export function Projects() {
  const projects = useProjects();

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section className="projects-section">
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
```

Remove any `"see all projects"` link - the tiles ARE the complete projects view.

### Step 4: Redesign ProjectsPage.tsx (/projects route)

**File:** `frontend/src/pages/Projects/ProjectsPage.tsx`

Read the current file. Replace the horizontal list card layout with the same tile grid.

**Key changes:**

1. Replace `ProjectListCard` (or inline card component) with `ProjectCard` using `linkTo`
2. Keep the search and category filter functionality
3. Use the `.projects-grid` class for the tile grid

**Updated grid section:**

```tsx
import { ProjectCard } from "../../components/sections/Projects/ProjectCard";

// ... inside the component, after filtering logic:

<div className="projects-grid">
  {filteredProjects.map((project) => (
    <ProjectCard
      key={project.id}
      project={project}
      linkTo={`/projects/${project.id}`}
    />
  ))}
</div>;
```

**Import the shared CSS** - ensure `Projects.css` styles are available on this page. Either:

- Import `Projects.css` in `ProjectCard.tsx` (already done since ProjectCard imports it)
- Or import it explicitly in `ProjectsPage.tsx`

### Step 5: Clean up ProjectsPage.css

**File:** `frontend/src/pages/Projects/ProjectsPage.css`

Remove old horizontal card styles that are no longer needed:

- `.project-list-card`, `.card-icon`, `.card-content`, `.card-arrow`
- `.card-title`, `.card-description`, `.card-technologies`, `.tech-tag`
- **Remove `.projects-grid` definition** from this file entirely - the shared definition in `Projects.css` is the single source of truth for tile grid layout. This avoids CSS specificity collisions when both stylesheets are loaded on `/projects`.

Keep page-level styles:

```css
.projects-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.projects-page h1 {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
}

/* Search and Filter styles - keep as-is */

/* Empty state */
.projects-empty {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}
```

### Step 6: Remove unused code

- If `ProjectListCard` was a separate function in `ProjectsPage.tsx`, remove it
- Remove `STATUS_COLORS` from `ProjectCard.tsx` if no longer used (status badges removed from tiles)
- Remove the `featured` prop from any remaining `ProjectCard` usage
- Remove GitHub language stats API call from `Projects.tsx` if present
- **Delete `GitHubStats.tsx` and `GitHubStats.css`** - only consumer was `Projects.tsx` GitHub section (now removed). Dead code.
- **Clean up barrel exports** - remove `GitHubStats` from `components/sections/Projects/index.ts` and `components/sections/index.ts`

---

## Responsive Behavior

- **Desktop (1440px):** 3-column grid, tiles approximately 280px wide each
- **Tablet (768px):** 2-column grid, tiles approximately 340px wide each
- **Mobile (375px):** 2-column grid, tiles approximately 160px wide each. Gradient height reduced to 60px. Font sizes slightly smaller. Gap reduced to 0.75rem.

---

## Accessibility Checklist

- [ ] All tiles are keyboard focusable (using `<a>` or `<Link>` elements)
- [ ] Focus indicator visible on tiles (default browser focus ring or custom `:focus-visible` outline)
- [ ] Color contrast: tile title `#1e293b` on white background = 12.6:1 ratio (WCAG AAA)
- [ ] Color contrast: description `#64748b` on white = 4.9:1 ratio (WCAG AA)
- [ ] Color contrast: tech pills `#475569` on `#f1f5f9` = 5.3:1 ratio (WCAG AA)
- [ ] Icons are decorative (title text provides context) - no alt text needed
- [ ] Dark mode maintains equivalent contrast ratios

---

## Test Plan

1. Run `cd frontend && npm run build` - should compile without errors
2. Run `cd frontend && npm run test:run` - update any broken tests (ProjectCard props changed)
3. Run `cd frontend && npm run lint` - no lint errors
4. Manual verification:
   a. **Home page -> Projects section:** 3-column tile grid on desktop
   b. All 7 projects visible as tiles in correct order
   c. Hover on tile: subtle lift + shadow animation
   d. Click tile: opens project URL in new tab
   e. Resize to 768px: 2-column grid
   f. Resize to 375px: 2-column compact grid, no overflow
   g. **`/projects` page:** Same tile grid with search/filter working
   h. Click tile on /projects: navigates to `/projects/{id}` detail page
   i. Search filters tiles correctly (search "python" shows matching projects)
   j. Category filter works
   k. **Dark mode:** Tiles render with correct dark theme colors on both pages

---

## Verification Checklist

- [ ] Home page shows 3-column tile grid at desktop
- [ ] `/projects` page shows same tile grid style
- [ ] All 7 projects render as tiles
- [ ] No "featured" full-width cards remain
- [ ] No separate "Other Projects" or "GitHub" sections remain
- [ ] Hover effect works (translateY + shadow)
- [ ] External links open in new tab (home page tiles)
- [ ] Internal links navigate to detail page (`/projects` page tiles)
- [ ] Search and category filter still work on `/projects`
- [ ] 2-column grid at tablet (768px) and mobile (375px)
- [ ] Tiles don't overflow at 375px
- [ ] Dark mode renders correctly on both pages
- [ ] Build passes, tests pass, lint passes

---

## What NOT To Do

- Do NOT make tiles different sizes - all tiles should be equal in the grid
- Do NOT use JavaScript for the grid layout - CSS Grid handles this
- Do NOT remove the search/filter functionality from `/projects` page
- Do NOT modify `ProjectDetailPage.tsx` - the detail page stays as-is
- Do NOT add the `image` field to tiles yet (potential future enhancement)
- Do NOT animate the grid layout with Framer Motion - keep it simple CSS
- Do NOT change the project data model or loader
- Do NOT use em-dashes in any text (per CLAUDE.md style guide)
- Do NOT add new dependencies - all of this is achievable with existing CSS + React
