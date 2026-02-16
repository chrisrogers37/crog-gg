# Phase 04: Section Entrance Animations & Transitions

## PR Title

**feat: replace CSS section transitions with Framer Motion AnimatePresence**

## Status: ✅ COMPLETE

Completed: 2026-02-16

## Metadata

| Field                | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Risk Level**       | Low-Medium                                                  |
| **Estimated Effort** | 1-2 hours                                                   |
| **Files Modified**   | 2-3 (`HomePage.tsx`, `App.css`, optionally `animations.ts`) |
| **Dependencies**     | None (Framer Motion 12 already installed)                   |

## Overview

Replace `react-transition-group` CSSTransition section switching with Framer Motion `AnimatePresence` + `motion.div`. Delivers smooth fade+slide exit/entrance animations when switching tabs. Keeps animations snappy (under 400ms per phase), preserves Timeline's internal `whileInView` animations, leaves About.tsx's internal bio-fade CSSTransition untouched.

## Changes

### 1. HomePage.tsx — Replace CSSTransition with AnimatePresence

**Imports — Before:**

```tsx
import { useRef, useMemo, useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
```

**After:**

```tsx
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
```

Remove `useRef` (no longer needed for CSSTransition's `nodeRef` pattern).

**Delete the nodeRef declaration (line 58):**

```tsx
const nodeRef = useRef<HTMLDivElement>(null);
```

**Main content — Before (lines 261-292):**

```tsx
<main>
  {activeSection && !previewMode ? (
    <CSSTransition
      nodeRef={nodeRef}
      in={!!activeSection}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <div
        ref={nodeRef}
        className={`content-section ${activeSection ? "visible" : ""}`}
      >
        {renderActiveSection()}
      </div>
    </CSSTransition>
  ) : (
    <div className="section-fade-previews">
      <SectionFadePreview ...>
        ...
      </SectionFadePreview>
    </div>
  )}
</main>
```

**After:**

```tsx
<main>
  <AnimatePresence mode="wait">
    {activeSection && !previewMode ? (
      <motion.div
        key={activeSection}
        className="content-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {renderActiveSection()}
      </motion.div>
    ) : (
      <motion.div
        key="preview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="section-fade-previews">
          <SectionFadePreview
            id="about"
            onExpand={handlePreviewExpand}
            maxHeight={180}
            index={0}
          >
            <section className="section-content about-section">
              <div className="about-content">
                <About onRegenerate={() => {}} content={bio ?? undefined} />
              </div>
            </section>
          </SectionFadePreview>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</main>
```

**Key decisions:**

- `mode="wait"` — exit finishes before enter begins, preventing layout jank
- `key={activeSection}` — tells AnimatePresence to unmount old/mount new on section change
- `y: 12` entrance / `y: -8` exit — asymmetric: exit is subtler, entrance has natural "settling" feel
- `ease: [0.4, 0, 0.2, 1]` — Material Design standard easing, matches existing `pageTransition` in `utils/animations.ts`
- `duration: 0.3` — 300ms per phase, well under 400ms ceiling

### 2. App.css — Remove CSS-based animation from `.content-section`

**Before (lines ~1084-1105):**

```css
.content-section {
  position: relative;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  transform: translateY(15px);
  transition:
    opacity 0.3s ease-in-out,
    transform 0.3s ease-in-out,
    visibility 0.3s ease-in-out;
  pointer-events: none;
  background-color: var(--card-background);
  min-height: 100px;
  padding: 1rem;
}

.content-section.visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}
```

**After:**

```css
.content-section {
  position: relative;
  width: 100%;
  background-color: var(--card-background);
  min-height: 100px;
  padding: 1rem;
}
```

Remove `.content-section.visible` entirely. Keep layout properties only — Framer Motion handles opacity/transform/visibility.

**KEEP** the `.fade-enter` / `.fade-exit` classes (lines ~710-723). They're still used by `About.tsx` for bio regeneration fade.

**KEEP** mobile overrides for `.content-section` padding at 768px and 480px breakpoints.

### 3. Optional: Add reusable variant to `utils/animations.ts`

**Add after `pageTransition` (~line 113):**

```tsx
export const sectionTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};
```

If added, the HomePage motion.div becomes:

```tsx
import { sectionTransition } from "../../utils/animations";

<motion.div
  key={activeSection}
  className="content-section"
  variants={sectionTransition}
  initial="hidden"
  animate="visible"
  exit="exit"
>
```

## Interaction with Existing Framer Motion Components

- **Timeline**: Uses `whileInView` + IntersectionObserver. `mode="wait"` unmounts then remounts, so Timeline entries re-animate naturally each time Journey is selected.
- **SkillBubbles**: Has its own nested `AnimatePresence`. Nested AnimatePresence works fine in Framer Motion.
- **SectionFadePreview**: Uses `motion.div` with `initial/animate`. Composes naturally inside the parent motion.div.
- **SectionNavigator**: Has a 0.5s delay fade-in. Starts after parent entrance, creating natural stagger.
- **ContactCTA**: Outside AnimatePresence entirely (line 309), unaffected.

## Test Plan

1. `cd frontend && npm run build` — TypeScript + build
2. `cd frontend && npm run test:run` — Unit tests
3. `cd frontend && npm run lint` — ESLint
4. `cd frontend && npm run test:e2e` — E2E tests (existing tests have adequate timeouts)
5. Manual: Click each tab — verify smooth fade+slide transition
6. Manual: Click active tab to toggle to preview — verify smooth exit+enter
7. Manual: Rapid clicks between sections — no stacking or stutter
8. Manual: SectionNavigator "up next" — triggers same animation
9. Manual: Mobile Menu section switch — same animation
10. Manual: Journey tab — Timeline entries still animate with whileInView
11. Manual: About regeneration — bio CSSTransition fade still works
12. Manual: `prefers-reduced-motion: reduce` — animations disabled, site still functional

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:e2e` passes
- [ ] Section switching shows smooth fade+slide
- [ ] Active tab toggle returns to preview with animation
- [ ] Timeline whileInView animations still work
- [ ] SkillBubbles AnimatePresence still works
- [ ] About bio regeneration fade still works
- [ ] No layout shift during transitions
- [ ] Animations feel snappy (under 400ms per phase)
- [ ] Works in dark mode
- [ ] Works on mobile viewports
- [ ] No console errors

## What NOT to Do

1. **Do NOT remove `react-transition-group` from package.json.** Still used by `About.tsx` and `Portfolio.tsx`.
2. **Do NOT touch About.tsx's internal CSSTransition.** Different concern.
3. **Do NOT use `mode="sync"` or `mode="popLayout"`.** Only `mode="wait"` prevents overlapping section renders.
4. **Do NOT add `layout` prop.** Conflicts with Timeline's IntersectionObserver.
5. **Do NOT animate the `<main>` tag.** Wrap content inside it, keep `<main>` as a stable landmark.
6. **Do NOT exceed 400ms per animation phase.** User wants snappy.
7. **Do NOT add `willChange` or `translateZ(0)`.** Framer Motion handles GPU acceleration internally.
8. **Do NOT remove the `key={activeSection}` on `<ErrorBoundary>` inside `renderActiveSection()`.** It's orthogonal.
