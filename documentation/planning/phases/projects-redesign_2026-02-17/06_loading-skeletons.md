# Phase 06: Loading Skeletons for Projects Grid

**Status:** 🔧 IN PROGRESS
**Started:** 2026-02-17

**PR Title:** `feat: add skeleton loading state for projects tile grid`
**Risk Level:** Low
**Estimated Effort:** Low (30-45 minutes)
**Files Modified:** 3-4 | **Files Created:** 0 | **Files Deleted:** 0

---

## Context

After Phase 05 redesigns the projects display as a tile grid, the loading state needs to match. Currently the projects page shows a centered spinner with "Loading projects..." text, which causes a content layout shift when projects load and pop in. The skeleton should match the tile grid layout so the transition from loading to loaded is seamless.

**Current loading state:** A centered spinner animation with "Loading projects..." text below it.

**Target:** A grid of skeleton tiles that pulse, matching the exact dimensions and layout of the real project tiles from Phase 05.

**Screenshot reference:** `/tmp/design-review/projects-desktop.png` - shows current spinner loading state.

---

## Dependencies

- **Depends on Phase 05** (grid tiles redesign). The skeleton must match the tile grid layout and reuse the same CSS classes (`.projects-grid`, `.project-tile`, `.project-tile-header`, `.project-tile-body`).

---

## Visual Specification

### Skeleton Tile

Each skeleton tile mimics the real tile layout with gray placeholder blocks:

```
+----------------------------+
|  ########################  |  <- Gray solid fill, 80px height (60px mobile), pulsing
|  ########################  |
|  ########################  |
+----------------------------+
|  ████████████              |  <- Title placeholder: 60% width, 14px height, rounded
|  ██████████████████████    |  <- Description line 1: 90% width, 10px height
|  ████████████████          |  <- Description line 2: 70% width, 10px height
|                            |
|  [====] [====] [====]      |  <- Tech pill placeholders: 3 small rounded rects
+----------------------------+
```

### Skeleton Grid

Same grid as real tiles:

- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 2 columns

Show **6 skeleton tiles** (approximate project count without revealing exact number).

### Animation

CSS pulse animation:

```css
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

Duration: 2s, cubic-bezier(0.4, 0, 0.6, 1), infinite loop.

---

## Detailed Implementation Plan

### Step 1: Add skeleton styles to Projects.css

**File:** `frontend/src/components/sections/Projects/Projects.css`

Add these styles after the existing tile styles:

```css
/* Skeleton Loading */
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-tile {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  pointer-events: none;
}

.skeleton-header {
  background: #e2e8f0;
}

.skeleton-line {
  border-radius: 4px;
  background: #e2e8f0;
}

.skeleton-title-line {
  width: 60%;
  height: 14px;
}

.skeleton-desc-line-1 {
  width: 90%;
  height: 10px;
}

.skeleton-desc-line-2 {
  width: 70%;
  height: 10px;
}

.skeleton-pill {
  width: 40px;
  height: 16px;
  border-radius: 4px;
  background: #e2e8f0;
}

/* Dark mode skeletons */
.dark .skeleton-header {
  background: #334155;
}

.dark .skeleton-line {
  background: #334155;
}

.dark .skeleton-pill {
  background: #334155;
}
```

### Step 2: Add skeleton grid to Projects.tsx (Home Page)

**File:** `frontend/src/components/sections/Projects/Projects.tsx`

Add a skeleton rendering function inside the component file (not a separate file):

```tsx
function ProjectSkeletonGrid() {
  return (
    <div className="projects-grid" role="status" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="project-tile skeleton-tile" aria-hidden="true">
          <div className="project-tile-header skeleton-header" />
          <div className="project-tile-body">
            <div className="skeleton-line skeleton-title-line" />
            <div className="skeleton-line skeleton-desc-line-1" />
            <div className="skeleton-line skeleton-desc-line-2" />
            <div className="project-tile-tech">
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Use it in the loading/empty state of the Projects component. Read the current component to find where projects are conditionally rendered. When `projects` is null/empty/loading, render:

```tsx
if (!projects || projects.length === 0) {
  return (
    <section className="projects-section">
      <ProjectSkeletonGrid />
    </section>
  );
}
```

**Note:** This covers the initial load case. If projects are truly empty (no YAML files), the skeleton will show indefinitely - but this is acceptable since the site always has projects configured.

### Step 3: Add skeleton grid to ProjectsPage.tsx

**File:** `frontend/src/pages/Projects/ProjectsPage.tsx`

Find the current loading state (renders spinner + "Loading projects..." text). Replace it with the skeleton grid.

The heading and subtitle should render even during loading for immediate context:

```tsx
if (isLoading) {
  return (
    <div className="projects-page">
      <h1>Projects</h1>
      <p className="page-subtitle">
        A collection of my work, side projects, and experiments.
      </p>
      <div
        className="projects-grid"
        role="status"
        aria-label="Loading projects"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="project-tile skeleton-tile"
            aria-hidden="true"
          >
            <div className="project-tile-header skeleton-header" />
            <div className="project-tile-body">
              <div className="skeleton-line skeleton-title-line" />
              <div className="skeleton-line skeleton-desc-line-1" />
              <div className="skeleton-line skeleton-desc-line-2" />
              <div className="project-tile-tech">
                <span className="skeleton-pill" />
                <span className="skeleton-pill" />
                <span className="skeleton-pill" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Remove old spinner loading state

Delete the old spinner/loading text markup from both components:

- Remove any `.loading-spinner` or similar elements
- Remove "Loading projects..." text
- Remove associated CSS for the old spinner (if defined in ProjectsPage.css)

---

## Responsive Behavior

Skeleton grid inherits the same responsive breakpoints from Phase 05's `.projects-grid`:

- Desktop: 3 skeleton columns
- Tablet: 2 skeleton columns
- Mobile: 2 skeleton columns with 60px header height

---

## Accessibility Checklist

- [ ] Skeleton container has `role="status"` and `aria-label="Loading projects"` for screen readers
- [ ] Individual skeleton tiles have `aria-hidden="true"` (decorative placeholders)
- [ ] `pointer-events: none` on skeleton tiles prevents accidental interaction
- [ ] Screen readers announce "Loading projects" instead of reading placeholder elements

---

## Test Plan

1. Run `cd frontend && npm run build` - should compile without errors
2. Run `cd frontend && npm run test:run` - all tests pass
3. Run `cd frontend && npm run lint` - no lint errors
4. Manual verification:
   a. Throttle network in DevTools (Slow 3G) to see loading state
   b. **Home page -> Projects section:** Skeleton grid appears during load
   c. **`/projects` page:** Skeleton grid with heading/subtitle appears during load
   d. Skeleton tiles match real tile dimensions (no layout shift when loaded)
   e. Pulse animation is smooth and subtle
   f. **Dark mode:** Skeletons use dark placeholder colors (#334155)
   g. After load: skeletons replaced by real tiles seamlessly

---

## Verification Checklist

- [ ] Skeleton grid renders during loading on home page projects section
- [ ] Skeleton grid renders during loading on `/projects` page
- [ ] 6 skeleton tiles displayed in grid
- [ ] Grid layout matches real tiles (3 col desktop, 2 col tablet/mobile)
- [ ] Pulse animation runs smoothly (2s cycle)
- [ ] No layout shift when real tiles replace skeletons
- [ ] Dark mode renders correctly
- [ ] Old spinner and "Loading projects..." text removed
- [ ] `role="status"` and `aria-label` present on skeleton container
- [ ] Build passes, tests pass, lint passes

---

## What NOT To Do

- Do NOT use a JavaScript shimmer library - pure CSS animation is sufficient
- Do NOT show exact project count in skeleton (use 6 as generic placeholder)
- Do NOT add Framer Motion transitions between skeleton and loaded state - a simple swap is fine (AnimatePresence in the parent already handles transitions)
- Do NOT create a separate SkeletonTile component file - keep it inline or as a local function
- Do NOT remove the loading state check - just replace what renders during it
- Do NOT add skeleton to the ProjectDetailPage - only the grid views need it
