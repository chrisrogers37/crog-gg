# Phase 03: Fix Mobile Tab Bar (Scroll Indicator + Auto-Scroll Active Tab)

## PR Title

**fix: auto-scroll active nav tab into view and improve mobile scroll indicator**

## Status: ✅ COMPLETE

Completed: 2026-02-16

## Metadata

| Field                | Value                                           |
| -------------------- | ----------------------------------------------- |
| **Risk Level**       | Low                                             |
| **Estimated Effort** | 1-2 hours                                       |
| **Files Modified**   | 2 (`SectionNav.tsx`, `App.css`)                 |
| **Files Added**      | 1 (`SectionNav.test.tsx`)                       |
| **Dependencies**     | Phase 02 must land first (480px padding change) |

## Changes

### 1. TSX: Auto-scroll active tab into view

**File**: `frontend/src/components/SectionNav.tsx`

Add `useEffect` import and a scroll-into-view effect that fires when `activeSection` changes, skipping the initial mount.

**Before** (line 1):

```tsx
import { useRef, useCallback } from "react";
```

**After:**

```tsx
import { useRef, useCallback, useEffect } from "react";
```

**Add after `const navRef = useRef<HTMLElement>(null);` (line 19):**

```tsx
const isFirstRender = useRef(true);

// Auto-scroll the active tab into view on narrow screens
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }

  if (!activeSection || !navRef.current) return;

  const activeButton = navRef.current.querySelector<HTMLButtonElement>(
    `[data-section="${activeSection}"]`,
  );
  activeButton?.scrollIntoView({
    behavior: "smooth",
    inline: "nearest",
    block: "nearest",
  });
}, [activeSection]);
```

**Key decisions:**

- `isFirstRender` ref prevents jarring scroll on page load when "about" is auto-selected
- `inline: 'nearest'` only scrolls the minimum amount needed (no-op if tab is already visible)
- `block: 'nearest'` prevents vertical page scrolling
- Queries by existing `data-section` attribute - no new attributes needed
- Catches both direct clicks AND programmatic changes from SectionNavigator/MobileMenu

### 2. CSS: Replace fade mask with subtle gradient overlay

**File**: `frontend/src/App.css`

The current `mask-image` at 640px literally hides the "Music" tab. Replace with a `::after` pseudo-element gradient that hints at scrollability without hiding content.

**Before** (lines ~1007-1019):

```css
@media (max-width: 640px) {
  .section-nav-container {
    justify-content: flex-start;
    width: max-content;
    min-width: 100%;
    padding: 0 0.5rem;
  }

  .section-nav {
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
}
```

**After:**

```css
@media (max-width: 640px) {
  .section-nav-container {
    justify-content: flex-start;
    width: max-content;
    min-width: 100%;
    padding: 0 0.5rem;
  }

  .section-nav {
    position: relative;
  }

  .section-nav::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 2rem;
    background: linear-gradient(to right, transparent, var(--card-background));
    pointer-events: none;
    z-index: 1;
  }
}
```

**Why:** The `::after` overlay creates a thin 2rem gradient at the right edge. Uses `var(--card-background)` so it auto-adapts to dark mode. `pointer-events: none` lets users tap through it.

### 3. CSS: Fix 480px section-nav margins for Phase 02

Phase 02 changes `.home-page` padding at 480px from 0.5rem to 1rem. The section-nav negative margins must match.

**Before** (lines ~1021-1027):

```css
@media (max-width: 480px) {
  .section-nav {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    width: calc(100% + 1rem);
  }
}
```

**After:**

```css
@media (max-width: 480px) {
  .section-nav {
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
  }
}
```

### 4. Unit Test (new file)

**File**: `frontend/src/components/__tests__/SectionNav.test.tsx`

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SectionNav from "../SectionNav";

describe("SectionNav", () => {
  it("renders all section buttons", () => {
    render(<SectionNav activeSection="" onSectionChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Journey" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Music" })).toBeInTheDocument();
  });

  it("marks active section button as selected", () => {
    render(<SectionNav activeSection="projects" onSectionChange={vi.fn()} />);
    const projectsBtn = screen.getByRole("tab", { name: "Projects" });
    expect(projectsBtn).toHaveAttribute("aria-selected", "true");
    expect(projectsBtn).toHaveClass("active");
  });

  it("calls onSectionChange when button clicked", () => {
    const onChange = vi.fn();
    render(<SectionNav activeSection="" onSectionChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("journey");
  });

  it("calls onSectionChange with empty string when active section clicked", () => {
    const onChange = vi.fn();
    render(<SectionNav activeSection="journey" onSectionChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Journey" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not scroll on initial render", () => {
    render(<SectionNav activeSection="about" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls active button into view when activeSection changes", () => {
    const { rerender } = render(
      <SectionNav activeSection="about" onSectionChange={vi.fn()} />,
    );
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    rerender(<SectionNav activeSection="music" onSectionChange={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  });

  it("supports keyboard navigation between tabs", () => {
    render(<SectionNav activeSection="about" onSectionChange={vi.fn()} />);
    const aboutBtn = screen.getByRole("tab", { name: "About" });
    aboutBtn.focus();

    fireEvent.keyDown(aboutBtn.parentElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Journey" })).toHaveFocus();
  });
});
```

**Note:** `Element.prototype.scrollIntoView = vi.fn()` is already in `frontend/src/test/setup.ts`.

## Test Plan

1. `cd frontend && npm run build` - TypeScript + build
2. `cd frontend && npm run test:run` - All unit tests including new SectionNav tests
3. `cd frontend && npm run lint` - ESLint
4. Manual at 375px: Click "Music" via SectionNavigator "up next" — tab bar smoothly scrolls
5. Manual at 375px: Refresh page — no horizontal scroll animation on load
6. Manual at 375px: Gradient visible on right edge of tab bar
7. Manual: Dark mode — gradient fades to dark card background, no white flash
8. Manual at 480px: Nav bar stretches edge-to-edge, no gaps
9. Manual at 1024px+: No gradient visible, tabs centered as before

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `npm run test:run` passes (including new SectionNav tests)
- [ ] `npm run lint` passes
- [ ] 375px: Active tab scrolls into view when changed
- [ ] 375px: No scroll on initial page load
- [ ] 375px: Subtle gradient on right edge of tab bar
- [ ] Dark mode: Gradient uses correct background color
- [ ] 480px: Nav stretches edge-to-edge
- [ ] Desktop: No visual changes
- [ ] Keyboard navigation still works

## What NOT to Do

1. **Do NOT add scroll dots or chevron arrows.** Gradient overlay is sufficient for 4 tabs.
2. **Do NOT add JS scroll position detection** to show/hide the gradient. Over-engineering.
3. **Do NOT change `overflow-x: auto` to `overflow-x: scroll`.** Would show scrollbars on some platforms.
4. **Do NOT use `scrollIntoView({ inline: 'center' })`.** `nearest` only scrolls minimum needed.
5. **Do NOT add individual refs to each button.** Query by existing `data-section` attribute.
6. **Do NOT remove `position: sticky` or `z-index: 100`.** The `::after` needs `position: relative` in the media query but sticky must remain.
7. **Do NOT add scroll logic to handleClick.** The useEffect on activeSection handles all cases including programmatic changes.
