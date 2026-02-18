# Phase 02: Reorder Projects by Impact + Add Dead Redux

**Status:** 🔧 IN PROGRESS
**Started:** 2026-02-17

**PR Title:** `feat: reorder projects by impact and add Dead Redux project`
**Risk Level:** Low
**Estimated Effort:** Low (30-45 minutes)
**Files Created:** 1 | **Files Modified:** 6 | **Files Deleted:** 0

---

## Context

The portfolio site currently orders projects weakest-first (30-Day A/Bs at order:1, Shuffify at order:5). Recruiters and collaborators see the least impressive work first. The user wants the most impressive/cool projects featured prominently.

Additionally, a new project "Dead Redux" needs to be added - a Grateful Dead project that shows a new show each day, deployed at dead-redux.vercel.app, built with TypeScript/React.

Hedwig should remain hidden (already excluded from `index.yaml`).

**Screenshot reference:** `/tmp/design-review/projects-desktop.png` - shows current project ordering with "Loading projects..." state.

---

## Target Project Order (by impact/coolness)

1. **Shuffify** (order: 1) - coolest, has its own domain shuffify.app
2. **Storyline AI** (order: 2) - strong, used daily by the creator
3. **Dead Redux** (order: 3) - NEW - cool side project built in a day
4. **Shitpost Alpha** (order: 4) - expansive product
5. **30 Day A/Bs** (order: 5) - shows experimentation knowledge
6. **City Cycles** (order: 6) - data viz project
7. **GitHub** (order: 99) - profile link, always last

---

## Dependencies

- **Depends on Phase 01** (YAML normalization) since both phases touch `shitpost-alpha.yaml` and `30-day-abs.yaml`. Phase 01 must merge first to avoid conflicts.
- Phase 05 depends on this phase completing first.

---

## Detailed Implementation Plan

### Step 1: Create dead-redux.yaml

**Create new file:** `frontend/public/content/projects/dead-redux.yaml`

```yaml
# Dead Redux - Daily Grateful Dead Shows
id: dead-redux
title: Dead Redux
description: a new grateful dead show hosted each day
url: https://dead-redux.vercel.app
icon: fas fa-record-vinyl
category: web-app
technologies:
  - TypeScript
  - React
  - Vercel
featured: true
order: 3
gradient: "linear-gradient(135deg, #991B1B 0%, #1a1a2e 100%)"
github: https://github.com/chrisrogers37/dead-redux
demo: https://dead-redux.vercel.app
status: active
tags:
  - music
  - grateful-dead
  - web-app
```

**Design notes:**

- Gradient uses dark red (#991B1B) to dark navy (#1a1a2e) to evoke the Grateful Dead aesthetic
- Icon uses Font Awesome's `fas fa-record-vinyl` (NOT `fas fa-music` which Shuffify already uses)
- Description matches the user's casual lowercase tone
- Uses standard `github` and `demo` field names (not `github_url`/`demo_url`)

### Step 2: Update index.yaml

**File:** `frontend/public/content/projects/index.yaml`

**Before:**

```yaml
projects:
  - 30-day-abs.yaml
  - shitpost-alpha.yaml
  - shuffify.yaml
  - city-cycles.yaml
  - storyline-ai.yaml
  - github.yaml
```

**After:**

```yaml
projects:
  - shuffify.yaml
  - storyline-ai.yaml
  - dead-redux.yaml
  - shitpost-alpha.yaml
  - 30-day-abs.yaml
  - city-cycles.yaml
  - github.yaml
```

The list order doesn't affect rendering (projects are sorted by the `order` field), but reordering the list to match display order improves readability for future maintainers.

### Step 3: Update order values in existing YAML files

For each file, find the `order:` line and update the value only. Do NOT change any other fields.

**File: `frontend/public/content/projects/shuffify.yaml`**

- Change `order: 5` to `order: 1`

**File: `frontend/public/content/projects/storyline-ai.yaml`**

- Change `order: 4` to `order: 2`

**File: `frontend/public/content/projects/shitpost-alpha.yaml`**

- Change `order: 2` to `order: 4`

**File: `frontend/public/content/projects/30-day-abs.yaml`**

- Change `order: 1` to `order: 5`

**File: `frontend/public/content/projects/city-cycles.yaml`**

- Change `order: 3` to `order: 6`

**File: `frontend/public/content/projects/github.yaml`**

- Already `order: 99`, no change needed.

### Step 4: Verify hedwig.yaml is NOT in index.yaml

Confirm that `hedwig.yaml` does NOT appear in `index.yaml`. It should remain excluded. The YAML file can stay on disk but must not be listed in the index.

---

## Responsive Behavior

N/A - data-only change. Display order affects all viewports equally.

---

## Accessibility Checklist

N/A - data-only change.

---

## Test Plan

1. Run `cd frontend && npm run build` - should compile without errors
2. Run `cd frontend && npm run test:run` - all tests should pass
3. Manual verification:
   a. Start dev server, go to home page, click "Projects" section tab
   b. Verify projects appear in new order: Shuffify, Storyline AI, Dead Redux, Shitpost Alpha, 30 Day A/Bs, City Cycles, GitHub
   c. Click on Dead Redux tile - verify it links to dead-redux.vercel.app
   d. Navigate to `/projects` page - verify Dead Redux appears in the listing
   e. Verify Hedwig does NOT appear anywhere
   f. Verify all existing project links still work

---

## Verification Checklist

- [ ] `dead-redux.yaml` exists at `frontend/public/content/projects/dead-redux.yaml`
- [ ] `dead-redux.yaml` has all required fields (id, title, description, url, icon, category, technologies, featured, order, gradient, github, demo, status, tags)
- [ ] `dead-redux.yaml` is listed in `index.yaml`
- [ ] `hedwig.yaml` is NOT in `index.yaml`
- [ ] `shuffify.yaml` has `order: 1`
- [ ] `storyline-ai.yaml` has `order: 2`
- [ ] `dead-redux.yaml` has `order: 3`
- [ ] `shitpost-alpha.yaml` has `order: 4`
- [ ] `30-day-abs.yaml` has `order: 5`
- [ ] `city-cycles.yaml` has `order: 6`
- [ ] `github.yaml` has `order: 99`
- [ ] Projects display in correct order on the site
- [ ] Dead Redux renders with correct gradient, icon, and links
- [ ] All existing projects still render correctly
- [ ] Build passes
- [ ] Tests pass

---

## What NOT To Do

- Do NOT delete `hedwig.yaml` from disk - just keep it out of `index.yaml`
- Do NOT modify any component code - this is a data-only change
- Do NOT change the `featured` status of existing projects
- Do NOT modify the project loader or type definitions
- Do NOT use em-dashes in the description (per CLAUDE.md style guide)
- Do NOT change field names in this PR - that was done in Phase 01
