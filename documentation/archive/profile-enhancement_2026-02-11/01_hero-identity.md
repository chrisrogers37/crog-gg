# Phase 01: Hero Identity Section

**Status:** ✅ COMPLETE
**Completed:** 2026-02-12
**PR Title:** Add hero identity section above the fold
**Risk Level:** Low
**Estimated Effort:** Small (2-4 hours)

## Files Modified

| Action   | File                                   |
| -------- | -------------------------------------- |
| Modified | `frontend/public/content/bio.yaml`     |
| Modified | `frontend/src/types/Bio.ts`            |
| Modified | `frontend/src/pages/Home/HomePage.tsx` |
| Modified | `frontend/src/pages/Home/HomePage.css` |

## Context

The #1 frustration is "unclear value prop." When someone lands on crog.gg, they see a profile photo, name, and a typewriter animation cycling casual greetings. There's no statement about what Chris does professionally. The bio is hidden behind an "About" tab. Recruiters who spend 6 seconds deciding whether to keep reading have no reason to stay.

This phase adds a concise identity statement between the header and section navigation - visible on first load without clicking anything.

## Dependencies

- **Depends on:** Nothing (this is Phase 01)
- **Unlocks:** Phase 03 (Career Timeline), Phase 04 (Section Flow)

## Detailed Implementation Plan

### Step 1: Add new fields to bio.yaml

**File:** `frontend/public/content/bio.yaml`

Add `tagline` and `role` fields after line 4 (`location`):

**Before (lines 1-5):**

```yaml
# Christopher T. Rogers - Bio Content
display_name: Christopher T. Rogers
email: christophertrogers37@gmail.com
location: New York City, New York
```

**After:**

```yaml
# Christopher T. Rogers - Bio Content
display_name: Christopher T. Rogers
email: christophertrogers37@gmail.com
location: New York City, New York

# Hero Identity
tagline: data engineer. builder. music maker.
role: Blockchain Data Engineer
```

### Step 2: Update the Bio type

**File:** `frontend/src/types/Bio.ts`

**Before (entire file):**

```typescript
export interface BioData {
  display_name: string;
  email: string;
  location: string;
  about_text: string;
  welcome_message: string;
  social_links: {
    github: string;
    hoobe: string;
    spotify: string;
    linkedin: string;
  };
}
```

**After:**

```typescript
export interface BioData {
  display_name: string;
  email: string;
  location: string;
  about_text: string;
  welcome_message: string;
  tagline?: string;
  role?: string;
  social_links: {
    github: string;
    hoobe: string;
    spotify: string;
    linkedin: string;
  };
}
```

Note: `tagline` and `role` are optional (`?`) so existing code doesn't break if the fields aren't present.

### Step 3: Add hero section to HomePage.tsx

**File:** `frontend/src/pages/Home/HomePage.tsx`

**Add import** at line 1 (add `motion` from framer-motion):

**Before (line 1):**

```typescript
import { useRef, useMemo } from "react";
```

**After:**

```typescript
import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
```

**Add hero section** between the closing `</header>` tag (line 264) and the `{/* Navigation */}` comment (line 266):

**Before (lines 264-267):**

```tsx
        </header>

        {/* Navigation */}
        <SectionNav
```

**After:**

```tsx
        </header>

        {/* Hero Identity */}
        {bio?.tagline && (
          <motion.div
            className="hero-identity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="hero-tagline">{bio.tagline}</p>
            {bio.role && (
              <p className="hero-role">{bio.role}</p>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <SectionNav
```

### Step 4: Add hero styles

**File:** `frontend/src/pages/Home/HomePage.css`

**Add** the following styles after line 12 (after the `.home-theme-toggle` block, before the media queries):

```css
/* Hero Identity Section */
.hero-identity {
  text-align: center;
  padding: 1.5rem 0 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}

.hero-tagline {
  font-size: 1.25rem;
  color: var(--text-secondary);
  font-weight: 300;
  letter-spacing: 0.5px;
  margin: 0;
}

.hero-role {
  font-size: 0.95rem;
  color: var(--text-muted, var(--text-secondary));
  margin: 0.5rem 0 0;
  font-weight: 400;
}

@media (max-width: 768px) {
  .hero-identity {
    padding: 1rem 0 0.75rem;
  }

  .hero-tagline {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .hero-tagline {
    font-size: 1rem;
  }
}
```

## Test Plan

### Unit Test

Create `frontend/src/pages/Home/__tests__/HomePage.test.tsx` or add to existing tests:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Test that hero section renders when bio has tagline
describe("HomePage Hero Section", () => {
  it("renders hero tagline when bio data includes tagline", () => {
    // Mock the store to return bio with tagline
    // Verify .hero-identity element exists
    // Verify tagline text is rendered
  });

  it("does not render hero section when tagline is missing", () => {
    // Mock bio without tagline
    // Verify .hero-identity does not exist
  });
});
```

### E2E Test

Update `frontend/e2e/home.spec.ts` - add a test that checks for the hero section **structurally** (not content):

```typescript
test("displays hero identity section", async ({ page }) => {
  const hero = page.locator(".hero-identity");
  await expect(hero).toBeVisible({ timeout: 5000 });

  const tagline = page.locator(".hero-tagline");
  await expect(tagline).toBeVisible();
});
```

## Documentation Updates

- No README changes needed
- bio.yaml now has two new optional fields: `tagline` and `role`

## Edge Cases

1. **bio.yaml missing new fields:** The `?.` optional chaining and `&&` conditional render handle this - hero section simply doesn't appear
2. **Loading state:** Hero section only renders when `bio` is truthy, so it won't flash during loading
3. **Very long tagline:** CSS will wrap naturally; keep taglines concise in content

## Verification Checklist

```bash
cd frontend && npm run build          # TypeScript check + build
cd frontend && npm run lint           # ESLint
cd frontend && npm run test:run       # Unit tests
cd frontend && npm run test:e2e       # E2E tests
```

- [ ] Hero section visible on homepage load (no tab click needed)
- [ ] Tagline and role render correctly
- [ ] Dark mode renders correctly
- [ ] Mobile responsive (check 768px and 480px breakpoints)
- [ ] Graceful when tagline/role missing from YAML

## What NOT To Do

- **Don't hard-code the tagline in JSX** - it must come from bio.yaml
- **Don't use em-dashes** in the tagline content (per CLAUDE.md)
- **Don't break the typewriter animation** - the hero goes AFTER the header, not replacing the typewriter
- **Don't use `interface`** for new types - but since we're extending an existing `interface` (BioData), just add fields to it
- **Don't add the hero to the loading skeleton** - it's fine for it to fade in after content loads
