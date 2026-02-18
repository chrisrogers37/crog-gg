# Phase 04: Fix Mobile Overflow on Home and Projects Pages

**Status:** ✅ COMPLETE
**Started:** 2026-02-17
**Completed:** 2026-02-17

**PR Title:** `fix: resolve content overflow and clipping on mobile viewports`
**Risk Level:** Low
**Estimated Effort:** Low (30-45 minutes)
**Files Modified:** 6 (CSS only) | **Files Created:** 0 | **Files Deleted:** 0

---

## Context

At 375px mobile viewport, multiple content areas overflow or clip off-screen:

1. **Home page section tabs** - The About/Journey/Projects/Music tabs overflow left edge. "About" is completely cut off, "Journey" partially visible.
2. **Home page bio text** - Text clips off the right edge without wrapping properly.
3. **Projects page subtitle** - "A collection of my work, side proje..." clips at the right edge.
4. **Projects page footer** - Copyright text overflows the right edge.
5. **Project detail "not found" text** - "Project Not Found" heading clips the right edge.

**Screenshot references:**

- `/tmp/design-review/home-mobile.png` - shows section tabs and bio text clipping
- `/tmp/design-review/projects-mobile.png` - shows subtitle and footer overflow
- `/tmp/design-review/project-detail-mobile.png` - shows heading overflow

---

## Dependencies

- **None.** This phase is independent and can run in parallel with Phases 01 and 03.
- Touches only CSS files that no other phase modifies (except ProjectsPage.css which Phase 05 also modifies, but Phase 05 depends on Phase 02 which is sequenced after this).

---

## Detailed Implementation Plan

### Step 1: Add global overflow containment

**File:** `frontend/src/index.css`

Read the file first. Find the existing `body` rule in the base layer. Add `overflow-x: hidden` to prevent any horizontal overflow from breaking the mobile layout:

```css
body {
  /* existing properties... */
  overflow-x: hidden;
}
```

If there's no existing `body` rule, add one. This is the safety net for all pages.

### Step 2: Make section tabs horizontally scrollable

**File:** Read `frontend/src/components/SectionNav.tsx` to identify the exact class names used.

The section nav likely uses a container class like `.section-nav-container` wrapping the tab buttons. Find the corresponding CSS (likely in `frontend/src/App.css` or a co-located CSS file).

Add/update these styles for the tab container:

```css
.section-nav-container {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  padding: 0 1rem;
  gap: 0.5rem;
}

.section-nav-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari - hide scrollbar but keep scroll functionality */
}
```

Ensure each tab button has `flex-shrink: 0` so buttons don't compress:

```css
.section-nav-button {
  flex-shrink: 0;
}
```

**Why this works:** Instead of tabs overflowing the viewport and being clipped, they become horizontally scrollable within a contained area. The scrollbar is hidden for aesthetics but scroll functionality is preserved for touch.

### Step 3: Add horizontal padding to home page content at mobile

**File:** `frontend/src/pages/Home/HomePage.css`

Read the file first. Add a mobile media query if one doesn't exist:

```css
@media (max-width: 640px) {
  .home-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

If `.home-page` already has padding at this breakpoint, ensure it's at least `1rem` (16px) on each side. Also check `.about-content`, `.section-content`, and `.content-section` classes - if any of these have `max-width` without horizontal padding, add `padding: 0 1rem`.

### Step 4: Fix projects page text overflow at mobile

**File:** `frontend/src/pages/Projects/ProjectsPage.css`

Read the file first. Find the page wrapper class and add mobile padding:

```css
@media (max-width: 640px) {
  .projects-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

If the class name differs, read `ProjectsPage.tsx` to find the correct wrapper class. The subtitle text needs room to wrap within the viewport.

### Step 5: Fix footer overflow at mobile

**Read:** `frontend/src/components/layout/Footer/Footer.tsx` and its CSS file.

The footer with copyright text and GitHub/LinkedIn links overflows at 375px. The fix is likely a flex-direction change at mobile:

```css
@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    padding: 0 1rem;
    gap: 0.5rem;
  }
}
```

Read the actual Footer CSS to find the correct class names. If the footer already has a mobile breakpoint, verify it includes horizontal padding.

### Step 6: Fix project detail page overflow at mobile

**Read:** `frontend/src/pages/Projects/ProjectDetailPage.tsx` or its CSS.

Add padding to the detail page wrapper at mobile:

```css
@media (max-width: 640px) {
  .project-detail {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

Read the actual file to find the correct class name for the page wrapper.

---

## Responsive Behavior

- **Desktop (1440px):** No visual change - existing padding is sufficient
- **Tablet (768px):** Minimal change - may already have enough padding, verify
- **Mobile (375px):** All overflow issues resolved:
  - Section tabs scroll horizontally within viewport
  - All text wraps within viewport bounds
  - Footer stacks vertically if needed
  - No horizontal scrollbar on the body

---

## Accessibility Checklist

- [ ] Section tabs remain keyboard navigable (arrow keys should scroll the container)
- [ ] Hidden scrollbar is cosmetic only - scroll functionality remains for touch and keyboard
- [ ] Text remains fully readable at all sizes (no truncation that hides meaning)
- [ ] Touch targets for section tabs remain at least 44px
- [ ] Focus indicators visible on all interactive elements at mobile

---

## Test Plan

1. Run `cd frontend && npm run build` - should compile without errors
2. Run `cd frontend && npm run test:run` - all tests pass
3. Manual verification at 375px viewport (use browser DevTools responsive mode):
   a. **Home page:** All 4 section tabs accessible (swipe/scroll right to see more)
   b. **Home page:** Bio text wraps within viewport, no horizontal clip
   c. **Home page:** "see more" link visible and tappable
   d. **Home page:** Photo showcase doesn't overflow
   e. **`/projects` page:** Subtitle text wraps properly
   f. **`/projects` page:** Footer doesn't overflow
   g. **`/projects/nonexistent`:** "Project Not Found" heading fits in viewport
4. Verify at **1440px** that nothing looks different (no regression)
5. Verify at **768px** tablet that layout is unaffected
6. Run `cd frontend && npm run lint`

---

## Verification Checklist

- [ ] No horizontal scrollbar appears on the page body at 375px
- [ ] Section tabs are horizontally scrollable with hidden scrollbar
- [ ] All 4 tab labels accessible (About, Journey, Projects, Music)
- [ ] Bio text wraps within viewport bounds at 375px
- [ ] Projects page subtitle wraps properly at 375px
- [ ] Footer content doesn't overflow at 375px
- [ ] "Project Not Found" heading fits in mobile viewport
- [ ] No visual regression at 1440px desktop
- [ ] No visual regression at 768px tablet
- [ ] Build passes
- [ ] Tests pass
- [ ] Lint passes

---

## What NOT To Do

- Do NOT remove or truncate any text content to "fix" overflow - the text should wrap
- Do NOT use `text-overflow: ellipsis` on headings or body text as a fix
- Do NOT add horizontal scroll to the page body - only the section tabs should scroll
- Do NOT change the section tab component JSX unless absolutely necessary (prefer CSS-only fixes)
- Do NOT add Tailwind classes to components that use vanilla CSS (check which styling approach each component uses first)
- Do NOT change font sizes to make text fit - fix the container instead
- Do NOT add `!important` to override styles - find the correct specificity
