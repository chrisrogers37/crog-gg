# Phase 02: Fix Mobile Text/Layout Clipping

## PR Title

**fix: prevent text clipping on small mobile viewports (375px)**

## Status: ✅ COMPLETE

Started: 2026-02-15
Completed: 2026-02-16

## Metadata

| Field                | Value      |
| -------------------- | ---------- |
| **Risk Level**       | Low        |
| **Estimated Effort** | 30 minutes |
| **Files Modified**   | 3          |
| **Breaking Changes** | None       |

## Root Cause

Two compounding problems:

**1. Insufficient outer padding at small viewports**
At `<= 480px`, `.home-page` drops to `padding: 0.5rem` (8px). Only 8px from the viewport edge on each side. At 375px, any inner padding stacking pushes text dangerously close to the edge.

**2. Double-nested `.about-section` padding**
`HomePage.tsx` wraps About in `<section class="section-content about-section">`, then the About component itself renders another `<div class="about-section">`. The `.about-section` class applies `padding: 1rem` — applied TWICE. Combined with `.home-page` and `.content-section` padding, 104px of 375px is consumed by padding (28% of screen width).

**Padding stack before fix at 375px:**
| Layer | Per Side | Cumulative |
|-------|----------|------------|
| `.home-page` | 8px | 8px |
| `.content-section` | 12px | 20px |
| `.about-section` (outer) | 16px | 36px |
| `.about-section` (inner, from About.tsx) | 16px | 52px |
| **Total per side** | | **52px** |
| **Available at 375px** | | **271px** |

## Changes

### Change 1: Increase `.home-page` minimum padding at 480px

**File**: `frontend/src/pages/Home/HomePage.css` (lines 83-87)

**Before:**

```css
@media (max-width: 480px) {
  .home-page {
    padding: 0.5rem;
  }
}
```

**After:**

```css
@media (max-width: 480px) {
  .home-page {
    padding: 1rem;
  }
}
```

### Change 2: Add overflow-wrap to `.header-tagline`

**File**: `frontend/src/pages/Home/HomePage.css` (lines 59-67)

**Before:**

```css
.header-tagline {
  font-size: 1rem;
  color: var(--text-color-secondary);
  font-weight: 300;
  letter-spacing: 0.3px;
  margin: 0;
  white-space: pre-line;
}
```

**After:**

```css
.header-tagline {
  font-size: 1rem;
  color: var(--text-color-secondary);
  font-weight: 300;
  letter-spacing: 0.3px;
  margin: 0;
  white-space: pre-line;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
```

### Change 3: Remove redundant `.about-section` wrapper from About component

**File**: `frontend/src/components/About.tsx` (lines 73-101)

**Before:**

```tsx
return (
  <div className="about-section">
    <div className="about-content">
      <div className="bio-container">
        <CSSTransition ...>
          <div className="bio">
            {content && (
              <div style={{ whiteSpace: "pre-line" }}>
                {content.about_text}
              </div>
            )}
          </div>
        </CSSTransition>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  </div>
);
```

**After:**

```tsx
return (
  <div className="bio-container">
    <CSSTransition
      in={bioInProp}
      timeout={500}
      classNames="fade"
      unmountOnExit={false}
    >
      <div className="bio">
        {content && (
          <div style={{ whiteSpace: "pre-line" }}>{content.about_text}</div>
        )}
      </div>
    </CSSTransition>
    {isLoading && (
      <div className="loading-overlay">
        <div className="spinner" />
      </div>
    )}
  </div>
);
```

**Important**: `.bio-container` must remain — it has `position: relative` needed for `.loading-overlay` absolute positioning.

### Change 4: Reduce `.section-content` and `.content-section` padding at 480px

**File**: `frontend/src/App.css` (lines 402-414)

**Before:**

```css
@media (max-width: 480px) {
  .app {
    padding: 0.5rem;
  }

  .section-content {
    padding: 0.75rem;
  }

  .content-section {
    padding: 0.75rem;
  }
}
```

**After:**

```css
@media (max-width: 480px) {
  .app {
    padding: 1rem;
  }

  .section-content {
    padding: 0.5rem;
  }

  .content-section {
    padding: 0.5rem;
  }
}
```

### Change 5: Add overflow-wrap to `.bio`

**File**: `frontend/src/App.css` (lines 442-449)

**Before:**

```css
.bio {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color);
  margin-bottom: 2rem;
  opacity: 1;
  visibility: visible;
}
```

**After:**

```css
.bio {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color);
  margin-bottom: 2rem;
  opacity: 1;
  visibility: visible;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
```

### Change 6: Remove header side padding at 480px

**File**: `frontend/src/App.css` — add after the existing `@media (max-width: 768px)` block (after line ~400):

```css
@media (max-width: 480px) {
  header {
    padding: 0;
  }
}
```

**Note**: This should be added inside the existing 480px media query block from Change 4.

**Padding stack after all fixes at 375px:**
| Layer | Per Side | Cumulative |
|-------|----------|------------|
| `.home-page` | 16px | 16px |
| `.content-section` | 8px | 24px |
| `.about-section` (only one now) | 16px | 40px |
| **Total per side** | | **40px** |
| **Available at 375px** | | **295px** (+24px recovered) |

## Test Plan

1. **375px** (iPhone SE): Tagline fully visible, bio text wraps with no clipping
2. **390px** (iPhone 14): Same checks
3. **412px** (Pixel 7): Same checks
4. **320px** (stress test): Nothing breaks, overflow-wrap handles edge cases
5. **768px** (tablet): Layout unchanged
6. **1024px+** (desktop): No regression
7. **Dark mode**: Toggle at each size above
8. Run: `cd frontend && npm run build && npm run test:run && npm run lint`

## Verification Checklist

- [x] `npm run build` passes
- [x] `npm run test:run` passes (82/82)
- [x] `npm run lint` passes
- [ ] 375px: tagline fully visible, no clipping
- [ ] 375px: bio text wraps, no right-edge clipping
- [ ] Loading spinner still centers over bio text
- [ ] SectionFadePreview gradient still works
- [ ] Desktop layout unchanged
- [ ] Both light and dark mode look correct

## What NOT to Do

1. **Do NOT add `overflow-x: auto` or scroll bars.** Make text wrap, not scroll.
2. **Do NOT reduce font sizes.** Fix is about spacing, not shrinking.
3. **Do NOT remove `white-space: pre-line`** from tagline. Needed for YAML line breaks.
4. **Do NOT change `max-width: 800px`** on `.home-page`.
5. **Do NOT touch `.section-nav`** negative-margin trick. Separate concern.
6. **Do NOT refactor About component** beyond removing the wrapper. CSSTransition, events, loading overlay stay.
7. **Do NOT add `!important`** to any rule.
