# Phase 01: Normalize YAML Data Inconsistencies

**Status:** ✅ COMPLETE
**Started:** 2026-02-17
**Completed:** 2026-02-17

**PR Title:** `fix: normalize project YAML field names for consistency`
**Risk Level:** Low
**Estimated Effort:** Low (15-30 minutes)
**Files Modified:** 3 | **Files Created:** 0 | **Files Deleted:** 0

---

## Context

Two project YAML files (`<removed>.yaml` and `30-day-abs.yaml`) use non-standard field names `github_url` and `demo_url` instead of the standard `github` and `demo` fields used by other projects and defined in the `Project` TypeScript interface at `frontend/src/types/Project.ts`.

The project loader at `frontend/src/utils/projectLoader.ts` currently maps these non-standard fields (lines 64-65: `github: projectData.github_url`, `demo: projectData.demo_url`), but the data should be normalized at the source for consistency.

This is a data-only cleanup that makes the YAML files self-consistent before Phase 02 reorders them.

**Screenshot reference:** N/A (no visual change)

---

## Dependencies

- **None.** This phase has no dependencies on other phases.
- Phases 03 and 04 can run in parallel with this one (disjoint files).
- Phase 02 depends on this phase completing first.

---

## Detailed Implementation Plan

### Step 1: Update <removed>.yaml

**File:** `frontend/public/content/projects/<removed>.yaml`

Read the file. Find the fields `github_url` and `demo_url`. Rename them:

**Before:**

```yaml
github_url: https://github.com/chrisrogers37/<removed>
demo_url: <removed>
```

**After:**

```yaml
github: https://github.com/chrisrogers37/<removed>
demo: <removed>
```

Keep all values identical. Do not change any other fields.

### Step 2: Update 30-day-abs.yaml

**File:** `frontend/public/content/projects/30-day-abs.yaml`

Same changes:

**Before:**

```yaml
github_url: https://github.com/chrisrogers37/30-day-abs
demo_url: https://30-day-abs.streamlit.app/
```

**After:**

```yaml
github: https://github.com/chrisrogers37/30-day-abs
demo: https://30-day-abs.streamlit.app/
```

Keep all values identical. Do not change any other fields.

### Step 3: Update projectLoader.ts to read new field names

**File:** `frontend/src/utils/projectLoader.ts`

**CRITICAL:** The loader's `RawProjectData` interface only declares `github_url` and `demo_url`. After renaming the YAML fields, the loader will fail to pick up the values, causing `project.github` and `project.demo` to be `undefined`. This breaks demo links on the detail page.

**3a. Update the `RawProjectData` interface** (around lines 7-23). Add `github` and `demo` fields while keeping the old names for backward compatibility:

```typescript
interface RawProjectData {
  id: string;
  title: string;
  description: string;
  url?: string;
  demo?: string; // new standard field
  demo_url?: string; // kept for backward compat
  github?: string; // new standard field
  github_url?: string; // kept for backward compat
  icon: string;
  category: string;
  technologies?: string[];
  featured?: boolean;
  order?: number;
  image?: string;
  gradient?: string;
  status?: "active" | "archived" | "experimental";
  tags?: string[];
}
```

**3b. Update both mapping blocks** in the file. There are two nearly identical blocks (one in the main branch, one in the fallback branch). In each, update the `url` fallback chain and the `github`/`demo` mappings:

**Before (in each block):**

```typescript
url:
  projectData.url ||
  projectData.demo_url ||
  projectData.github_url ||
  "#",
// ...
github: projectData.github_url,
demo: projectData.demo_url,
```

**After (in each block):**

```typescript
url:
  projectData.url ||
  projectData.demo ||
  projectData.demo_url ||
  projectData.github ||
  projectData.github_url ||
  "#",
// ...
github: projectData.github || projectData.github_url,
demo: projectData.demo || projectData.demo_url,
```

The `||` fallback chains prefer the new field name but fall back to the old name if present.

---

## Responsive Behavior

N/A - data-only change, no visual impact.

---

## Accessibility Checklist

N/A - data-only change.

---

## Test Plan

1. Run `cd frontend && npm run build` - should compile without errors
2. Run `cd frontend && npm run test:run` - all tests should pass
3. Manual verification:
   - Start dev server (`cd frontend && npm run dev`)
   - Navigate to home page, click "Projects" section tab
   - Verify a removed project renders with correct GitHub and demo links
   - Verify 30 Day A/Bs renders with correct GitHub and demo links
   - Click through to verify links open correctly

---

## Verification Checklist

- [ ] `<removed>.yaml` uses `github` not `github_url`
- [ ] `<removed>.yaml` uses `demo` not `demo_url`
- [ ] `30-day-abs.yaml` uses `github` not `github_url`
- [ ] `30-day-abs.yaml` uses `demo` not `demo_url`
- [ ] No other fields were changed in either YAML file
- [ ] `projectLoader.ts` `RawProjectData` includes both `github`/`demo` and `github_url`/`demo_url`
- [ ] Both mapping blocks use `projectData.github || projectData.github_url`
- [ ] Both mapping blocks use `projectData.demo || projectData.demo_url`
- [ ] Build passes
- [ ] Tests pass
- [ ] Both projects render correctly on the site with working links

---

## What NOT To Do

- Do NOT remove `github_url`/`demo_url` from `RawProjectData` entirely - keep them for backward compatibility
- Do NOT change any YAML values, only field names
- Do NOT modify any other YAML files in this PR
- Do NOT change the `Project` type interface - it already supports `github` and `demo` fields
