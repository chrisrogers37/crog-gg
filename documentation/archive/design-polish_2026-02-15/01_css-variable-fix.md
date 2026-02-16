# Phase 01: Fix CSS Variable Mismatch in Timeline

## PR Title

**fix: correct CSS variable names in Timeline to match theme system**

## PR Description

The Timeline component references CSS variables `--text-secondary` and `--text-primary` which do not exist in the theme system defined in `App.css`. The actual theme variables are `--text-color-secondary` and `--text-color`. Because these undefined variables have no value, the browser falls back to inherited or initial color values, causing timeline text to display with incorrect colors -- particularly noticeable in dark mode where text may appear dark on a dark background.

## Status: ✅ COMPLETE

Started: 2026-02-15
Completed: 2026-02-16

## Metadata

| Field                | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Risk Level**       | Low                                                          |
| **Estimated Effort** | 15 minutes                                                   |
| **Files Modified**   | 1 (`frontend/src/components/sections/Timeline/Timeline.css`) |
| **Breaking Changes** | None                                                         |

## Why This Matters

1. **Dark mode is broken for timeline text.** Without a valid variable, `color` falls back to inherited or initial values. In dark mode, the card background is `#1e293b` (dark slate). If text falls back to the browser default (black), it will be nearly invisible.
2. **Light mode is subtly wrong.** The secondary text (periods, org names, one-liners, skills heading) should be `#64748b` (muted slate) but may display as inherited primary text color or browser-default black. Visual hierarchy is lost.
3. **Consistency.** Every other CSS file in the project correctly uses `var(--text-color)` and `var(--text-color-secondary)`. Timeline is the only outlier.

## Exact Changes

All changes in `frontend/src/components/sections/Timeline/Timeline.css`:

### Change 1: `.timeline-period` (Line ~113)

**Before:**

```css
color: var(--text-secondary);
```

**After:**

```css
color: var(--text-color-secondary);
```

### Change 2: `.timeline-title` (Line ~119)

**Before:**

```css
color: var(--text-primary);
```

**After:**

```css
color: var(--text-color);
```

### Change 3: `.timeline-org` (Line ~126)

**Before:**

```css
color: var(--text-secondary);
```

**After:**

```css
color: var(--text-color-secondary);
```

### Change 4: `.timeline-one-liner` (Line ~139)

**Before:**

```css
color: var(--text-secondary);
```

**After:**

```css
color: var(--text-color-secondary);
```

### Change 5: `.timeline-skills-heading` (Line ~157)

**Before:**

```css
color: var(--text-secondary);
```

**After:**

```css
color: var(--text-color-secondary);
```

## Summary Table

| Selector                   | Old Variable            | New Variable                  |
| -------------------------- | ----------------------- | ----------------------------- |
| `.timeline-period`         | `var(--text-secondary)` | `var(--text-color-secondary)` |
| `.timeline-title`          | `var(--text-primary)`   | `var(--text-color)`           |
| `.timeline-org`            | `var(--text-secondary)` | `var(--text-color-secondary)` |
| `.timeline-one-liner`      | `var(--text-secondary)` | `var(--text-color-secondary)` |
| `.timeline-skills-heading` | `var(--text-secondary)` | `var(--text-color-secondary)` |

## Test Plan

1. `cd frontend && npm run build` - TypeScript check + Vite build
2. `cd frontend && npm run test:run` - Unit tests
3. `cd frontend && npm run lint` - ESLint
4. Visual check in light mode: timeline title is dark slate, secondary text is muted slate
5. Visual check in dark mode: all timeline text is legible against dark card backgrounds
6. `grep -rn "text-secondary\|text-primary" frontend/src/ --include="*.css"` - should return zero results

## Verification Checklist

- [x] All 5 variable references in Timeline.css updated
- [x] No references to `--text-secondary` or `--text-primary` remain in any `.css` file under `frontend/src/`
- [x] `npm run build` passes
- [x] `npm run test:run` passes (82/82)
- [x] `npm run lint` passes
- [ ] Light mode: timeline text colors match the rest of the site
- [ ] Dark mode: all timeline text is legible
- [x] No other files were modified

## What NOT to Do

1. **Do NOT add `--text-primary` or `--text-secondary` as new variables in App.css.** The project has an established naming convention. Adding aliases creates confusion.
2. **Do NOT add fallback values** (e.g., `var(--text-color-secondary, #64748b)`). The variables are defined in `:root` and `.dark` and are guaranteed to exist.
3. **Do NOT update archived documentation files.** Those are historical records.
4. **Do NOT change any other properties** in the affected selectors. Surgical fix only.
5. **Do NOT modify Timeline.tsx.** This is CSS-only.
