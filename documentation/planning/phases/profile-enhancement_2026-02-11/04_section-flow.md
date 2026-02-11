# Phase 04: Section Flow Navigation

**PR Title:** Add section flow navigation with next-section affordances
**Risk Level:** Low
**Estimated Effort:** Small (2-3 hours)

## Files Modified

| Action   | File                                                                   |
| -------- | ---------------------------------------------------------------------- |
| Created  | `frontend/src/components/common/SectionNavigator/SectionNavigator.tsx` |
| Created  | `frontend/src/components/common/SectionNavigator/SectionNavigator.css` |
| Created  | `frontend/src/components/common/SectionNavigator/index.ts`             |
| Modified | `frontend/src/pages/Home/HomePage.tsx`                                 |

## Context

Every section on the homepage is a dead end. When someone finishes reading the About section, there's no nudge to continue to Journey. They have to manually find and click the tab bar. This breaks the reading flow and causes drop-offs.

After Phase 03, the section order is: About, Journey, Projects, Music. This phase adds a subtle "up next" affordance at the bottom of each section that naturally leads visitors through the full narrative.

## Dependencies

- **Depends on:** Phase 03 (section structure changed to About/Journey/Projects/Music)
- **Unlocks:** Phase 07 (mobile nav needs to account for flow navigation)

## Detailed Implementation Plan

### Step 1: Create SectionNavigator component

**File:** `frontend/src/components/common/SectionNavigator/SectionNavigator.tsx` (NEW)

```tsx
import { motion } from "framer-motion";
import "./SectionNavigator.css";

type SectionNavigatorProps = {
  nextSection: string | null;
  nextLabel: string | null;
  onNavigate: (section: string) => void;
};

export function SectionNavigator({
  nextSection,
  nextLabel,
  onNavigate,
}: SectionNavigatorProps) {
  if (!nextSection || !nextLabel) return null;

  return (
    <motion.div
      className="section-navigator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <button
        className="section-navigator-btn"
        onClick={() => onNavigate(nextSection)}
      >
        <span className="section-navigator-label">up next: {nextLabel}</span>
        <span className="section-navigator-arrow">&#8595;</span>
      </button>
    </motion.div>
  );
}
```

### Step 2: Create SectionNavigator styles

**File:** `frontend/src/components/common/SectionNavigator/SectionNavigator.css` (NEW)

```css
.section-navigator {
  text-align: center;
  padding: 1.5rem 0;
  margin-top: 1rem;
}

.section-navigator-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.section-navigator-btn:hover {
  color: var(--primary-color);
  background: var(--hover-background, rgba(0, 0, 0, 0.03));
}

.section-navigator-label {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.section-navigator-arrow {
  font-size: 1.2rem;
  animation: bounce-down 1.5s ease-in-out infinite;
}

@keyframes bounce-down {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}
```

### Step 3: Create barrel export

**File:** `frontend/src/components/common/SectionNavigator/index.ts` (NEW)

```typescript
export { SectionNavigator } from "./SectionNavigator";
```

### Step 4: Integrate into HomePage

**File:** `frontend/src/pages/Home/HomePage.tsx`

**Add import** (with other component imports):

```typescript
import { SectionNavigator } from "../../components/common/SectionNavigator";
```

**Define section order** as a constant inside the component (after the `handleSectionChange` function, around line 103):

```typescript
// Section order for flow navigation
const sectionOrder = ["about", "journey", "projects", "music"];
const sectionLabels: Record<string, string> = {
  about: "about",
  journey: "journey",
  projects: "projects",
  music: "music",
};

const getNextSection = () => {
  const currentIndex = sectionOrder.indexOf(activeSection);
  if (currentIndex === -1 || currentIndex >= sectionOrder.length - 1) {
    return null;
  }
  return sectionOrder[currentIndex + 1];
};
```

**Add SectionNavigator** inside the `renderActiveSection` function. Modify the return at the bottom of `renderActiveSection` to include it:

**Before** (the return block inside renderActiveSection):

```tsx
return (
  <ErrorBoundary key={activeSection} compact>
    {content}
  </ErrorBoundary>
);
```

**After:**

```tsx
const nextSection = getNextSection();

return (
  <ErrorBoundary key={activeSection} compact>
    {content}
    <SectionNavigator
      nextSection={nextSection}
      nextLabel={nextSection ? sectionLabels[nextSection] : null}
      onNavigate={handleSectionChange}
    />
  </ErrorBoundary>
);
```

## Test Plan

### Unit Test

Create `frontend/src/components/common/SectionNavigator/__tests__/SectionNavigator.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SectionNavigator } from "../SectionNavigator";

describe("SectionNavigator", () => {
  it("renders next section label", () => {
    render(
      <SectionNavigator
        nextSection="journey"
        nextLabel="journey"
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText(/up next: journey/i)).toBeInTheDocument();
  });

  it("calls onNavigate when clicked", () => {
    const onNavigate = vi.fn();
    render(
      <SectionNavigator
        nextSection="journey"
        nextLabel="journey"
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onNavigate).toHaveBeenCalledWith("journey");
  });

  it("returns null when nextSection is null", () => {
    const { container } = render(
      <SectionNavigator
        nextSection={null}
        nextLabel={null}
        onNavigate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

### E2E Test

Add to `frontend/e2e/home.spec.ts`:

```typescript
test("section navigator shows next section", async ({ page }) => {
  // Click About tab
  await page.locator('button[data-section="about"]').click();

  // Check for navigator
  const navigator = page.locator(".section-navigator");
  await expect(navigator).toBeVisible({ timeout: 5000 });

  // Should show "up next: journey"
  await expect(navigator).toContainText(/up next/i);
});
```

## Documentation Updates

- New component: `frontend/src/components/common/SectionNavigator/`

## Edge Cases

1. **Last section (Music):** `getNextSection()` returns `null`, SectionNavigator returns `null` - no arrow shown
2. **No active section:** SectionNavigator is only rendered inside `renderActiveSection()`, so it only appears when a section is active
3. **Fast section switching:** Framer Motion `AnimatePresence` handles exit/enter transitions

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] "up next" appears at the bottom of About, Journey, Projects sections
- [ ] No "up next" appears at the bottom of Music (last section)
- [ ] Clicking "up next" transitions to the correct section
- [ ] The tab bar also updates when navigating via the flow button
- [ ] Animation is subtle and doesn't interfere with content reading
- [ ] Dark mode rendering correct

## What NOT To Do

- **Don't auto-advance sections** - visitor controls pacing, this is just a nudge
- **Don't make it flashy or distracting** - subtle muted text with a gentle bounce
- **Don't change the tab bar behavior** - it should still work independently
- **Don't use em-dashes** in labels
- **Don't capitalize the labels** - keep them lowercase ("up next: journey" not "Up Next: Journey")
