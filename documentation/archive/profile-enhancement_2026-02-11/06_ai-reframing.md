# Phase 06: AI Feature Reframing

**Status:** ⏭️ SKIPPED
**Skipped:** 2026-02-12
**Reason:** User reviewed the plan and decided the fantasy theming ("SUMMON NEW LORE", "DISPEL ENCHANTMENT", "Weaving Epic Saga...") is the soul of the feature and should stay. The reframing would strip out personality that makes the portfolio distinctive.

**PR Title:** Reframe AI regeneration as technical showcase
**Risk Level:** Low
**Estimated Effort:** Small (2-3 hours)

## Files Modified

| Action   | File                                                      |
| -------- | --------------------------------------------------------- |
| Modified | `frontend/src/components/ActionButtons/ActionButtons.tsx` |
| Modified | `frontend/src/components/ActionButtons/ActionButtons.css` |
| Modified | `frontend/public/content/bio.yaml`                        |

## Context

The AI content regeneration is the site's unique differentiator - the feature Chris is most proud of. But it's positioned as a novelty:

- Button says "SUMMON NEW LORE" (gamified, not professional)
- Reset button says "DISPEL ENCHANTMENT"
- Loading state says "Weaving Epic Saga..."
- Bio text mentions "activate FANTASY MODE" as if it's a gimmick

Visitors don't realize this is a custom GPT integration that Chris built. The feature should be a portfolio piece itself, demonstrating technical capability, not just a fun toy.

This phase reframes the AI feature so visitors think "he built this" rather than just "that's cute."

## Dependencies

- **Depends on:** Nothing (can run parallel with any phase)
- **Unlocks:** Phase 07 (mobile nav should account for reframed buttons)

## Detailed Implementation Plan

### Step 1: Update ActionButtons component

**File:** `frontend/src/components/ActionButtons/ActionButtons.tsx`

**Before (entire file):**

```tsx
import { ActionButtonsProps } from "../../types";
import "./ActionButtons.css";

/**
 * ActionButtons Component
 *
 * Renders the regeneration and reset buttons with fantasy theming.
 * - "SUMMON NEW LORE" triggers content regeneration via API
 * - "DISPEL ENCHANTMENT" resets content to original YAML data
 */
export function ActionButtons({
  onRegenerate,
  onReset,
  isRegenerating,
  hasModifiedContent,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button
        className="generate-btn"
        onClick={onRegenerate}
        disabled={isRegenerating}
        aria-label="Regenerate content with AI"
      >
        {isRegenerating ? "Weaving Epic Saga..." : "SUMMON NEW LORE"}
      </button>

      {hasModifiedContent && (
        <button
          className="reset-btn"
          onClick={onReset}
          disabled={isRegenerating}
          aria-label="Reset content to original"
        >
          DISPEL ENCHANTMENT
        </button>
      )}
    </div>
  );
}
```

**After:**

```tsx
import { ActionButtonsProps } from "../../types";
import "./ActionButtons.css";

/**
 * ActionButtons Component
 *
 * Renders the AI regeneration and reset buttons.
 * The regenerate button triggers content rewriting via a custom OpenAI integration.
 * The reset button reverts to original YAML content.
 */
export function ActionButtons({
  onRegenerate,
  onReset,
  isRegenerating,
  hasModifiedContent,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <div className="action-buttons-explainer">
        <p className="action-buttons-description">
          i built a custom ai integration that rewrites this page in real time.
          try it out.
        </p>
      </div>

      <div className="action-buttons-row">
        <button
          className="generate-btn"
          onClick={onRegenerate}
          disabled={isRegenerating}
          aria-label="Regenerate content with AI"
        >
          <span className="generate-btn-icon" aria-hidden="true">
            &#10024;
          </span>
          {isRegenerating ? "rewriting..." : "regenerate with ai"}
        </button>

        {hasModifiedContent && (
          <button
            className="reset-btn"
            onClick={onReset}
            disabled={isRegenerating}
            aria-label="Reset content to original"
          >
            reset to original
          </button>
        )}
      </div>
    </div>
  );
}
```

### Step 2: Update ActionButtons styles

**File:** `frontend/src/components/ActionButtons/ActionButtons.css`

**Before (entire file):**

```css
/* Action Buttons Container */
.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--card-background);
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}

/* Button Base Styles */
.action-buttons .generate-btn,
.action-buttons .reset-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Generate Button */
.action-buttons .generate-btn {
  background-color: var(--primary-color);
  color: white;
}

.action-buttons .generate-btn:hover {
  background-color: var(--hover-color);
}

.action-buttons .generate-btn:disabled {
  background-color: var(--primary-color);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reset Button */
.action-buttons .reset-btn {
  background-color: #dc2626;
  color: white;
}

.action-buttons .reset-btn:hover {
  background-color: #b91c1c;
}

.action-buttons .reset-btn:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    margin: 1rem 0;
    padding: 1rem;
  }
}
```

**After:**

```css
/* Action Buttons Container */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Explainer text */
.action-buttons-explainer {
  text-align: center;
  max-width: 400px;
}

.action-buttons-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Button row */
.action-buttons-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Button Base Styles */
.action-buttons .generate-btn,
.action-buttons .reset-btn {
  padding: 0.6rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-weight: 500;
  white-space: nowrap;
}

/* Generate Button */
.action-buttons .generate-btn {
  background-color: var(--primary-color);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.generate-btn-icon {
  font-size: 1rem;
}

.action-buttons .generate-btn:hover {
  background-color: var(--hover-color);
}

.action-buttons .generate-btn:disabled {
  background-color: var(--primary-color);
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reset Button */
.action-buttons .reset-btn {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.action-buttons .reset-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.action-buttons .reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .action-buttons {
    padding: 1rem;
  }

  .action-buttons-row {
    flex-direction: column;
    width: 100%;
  }

  .action-buttons .generate-btn,
  .action-buttons .reset-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}
```

### Step 3: Update bio.yaml to reframe AI mention

**File:** `frontend/public/content/bio.yaml`

Update the last paragraph of `about_text` to reframe the AI feature:

**Before (line 26):**

```yaml
or flip the whole thing on its head and click the button below to activate FANTASY MODE.
```

**After:**

```yaml
oh, and i built a custom ai integration that can rewrite this entire page in real time. give the button below a try.
```

## Test Plan

### Unit Test

Update or create `frontend/src/components/ActionButtons/__tests__/ActionButtons.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionButtons } from "../ActionButtons";

describe("ActionButtons", () => {
  const defaultProps = {
    onRegenerate: vi.fn(),
    onReset: vi.fn(),
    isRegenerating: false,
    hasModifiedContent: false,
  };

  it("renders the explainer text", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByText(/custom ai integration/i)).toBeInTheDocument();
  });

  it("shows 'regenerate with ai' button", () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByText(/regenerate with ai/i)).toBeInTheDocument();
  });

  it("shows 'rewriting...' when regenerating", () => {
    render(<ActionButtons {...defaultProps} isRegenerating={true} />);
    expect(screen.getByText(/rewriting/i)).toBeInTheDocument();
  });

  it("shows reset button only when content is modified", () => {
    const { rerender } = render(<ActionButtons {...defaultProps} />);
    expect(screen.queryByText(/reset to original/i)).not.toBeInTheDocument();

    rerender(<ActionButtons {...defaultProps} hasModifiedContent={true} />);
    expect(screen.getByText(/reset to original/i)).toBeInTheDocument();
  });
});
```

### E2E Test

Update `frontend/e2e/home.spec.ts`:

```typescript
test("action buttons show AI explainer", async ({ page }) => {
  // Click any section to make buttons appear
  await page.locator('button[data-section="about"]').click();

  const explainer = page.locator(".action-buttons-description");
  await expect(explainer).toBeVisible({ timeout: 5000 });

  const generateBtn = page.locator(".generate-btn");
  await expect(generateBtn).toBeVisible();
});
```

## Documentation Updates

- ActionButtons component no longer uses fantasy theming by default
- Bio.yaml about_text reworded to frame AI as a technical achievement

## Edge Cases

1. **API failure during regeneration:** Existing error handling in contentStore still works - button re-enables after failure
2. **Double-click prevention:** `disabled={isRegenerating}` prevents multiple simultaneous calls
3. **Reset when not modified:** Reset button only shows when `hasModifiedContent` is true

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] Explainer text visible: "i built a custom ai integration..."
- [ ] Button says "regenerate with ai" (lowercase, with sparkle icon)
- [ ] Loading state says "rewriting..." (not "Weaving Epic Saga")
- [ ] Reset button says "reset to original" (not "DISPEL ENCHANTMENT")
- [ ] Reset button is now a subtle outlined style (not red)
- [ ] Bio about_text references the AI feature as a technical achievement
- [ ] Dark mode rendering correct
- [ ] Mobile responsive (buttons stack)
- [ ] Regeneration still works end-to-end (API call succeeds)

## What NOT To Do

- **Don't remove Fantasy Mode entirely** - it still works via `regenerate(true)` in HomePage; just the labeling changes
- **Don't change the API integration or backend** - only frontend labels/styles change
- **Don't use em-dashes** in the explainer text
- **Don't make the buttons UPPERCASE** - lowercase is the tone
- **Don't add a tooltip** - the inline explainer text is sufficient
