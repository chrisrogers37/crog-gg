# Phase 02: Contact CTA + Homepage Footer

**Status:** 📋 PENDING
**PR Title:** Add contact CTA section and bring footer to homepage
**Risk Level:** Low
**Estimated Effort:** Small (2-3 hours)

## Files Modified

| Action   | File                                                         |
| -------- | ------------------------------------------------------------ |
| Created  | `frontend/src/components/sections/ContactCTA/ContactCTA.tsx` |
| Created  | `frontend/src/components/sections/ContactCTA/ContactCTA.css` |
| Created  | `frontend/src/components/sections/ContactCTA/index.ts`       |
| Modified | `frontend/src/components/layout/Layout/Layout.tsx`           |
| Modified | `frontend/src/pages/Home/HomePage.tsx`                       |

## Context

The #1 success metric is "they reach out." Currently there's no conversion path on the homepage:

- Email is a tiny link in the header (line 227 of HomePage.tsx)
- No "let's work together" or "get in touch" button anywhere
- The footer (with GitHub/LinkedIn links) is **hidden on the homepage** (Layout.tsx line 35: `{!isHomePage && <Footer />}`)
- Social links in the footer don't match the fuller set in bio.yaml

This phase creates a clear path from "impressed" to "reaching out."

## Dependencies

- **Depends on:** Nothing (can run parallel with Phase 01)
- **Unlocks:** Phase 04 (Section Flow can reference CTA as the terminal action)

## Detailed Implementation Plan

### Step 1: Create ContactCTA component

**File:** `frontend/src/components/sections/ContactCTA/ContactCTA.tsx` (NEW)

```tsx
import { motion } from "framer-motion";
import { useBio } from "../../../store";
import "./ContactCTA.css";

export function ContactCTA() {
  const bio = useBio();

  if (!bio) return null;

  return (
    <motion.section
      className="contact-cta"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="contact-cta-heading">let's connect</h3>
      <p className="contact-cta-text">
        interested in working together, have a question, or just want to say
        hey? i'd love to hear from you.
      </p>
      <div className="contact-cta-links">
        <a
          href={`mailto:${bio.email}`}
          className="contact-cta-btn contact-cta-primary"
        >
          send me an email
        </a>
        <a
          href={
            bio.social_links?.linkedin ||
            "https://linkedin.com/in/chrisrogers37"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="contact-cta-btn contact-cta-secondary"
        >
          connect on linkedin
        </a>
      </div>
      <div className="contact-cta-social">
        {bio.social_links?.spotify && (
          <a
            href={bio.social_links.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
          >
            Spotify
          </a>
        )}
        {bio.social_links?.hoobe && (
          <a
            href={bio.social_links.hoobe}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hoobe"
          >
            Hoobe
          </a>
        )}
      </div>
    </motion.section>
  );
}
```

### Step 2: Create ContactCTA styles

**File:** `frontend/src/components/sections/ContactCTA/ContactCTA.css` (NEW)

```css
.contact-cta {
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.contact-cta-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.75rem;
}

.contact-cta-text {
  color: var(--text-color-secondary);
  font-size: 1rem;
  max-width: 480px;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.contact-cta-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.contact-cta-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.contact-cta-primary {
  background-color: var(--primary-color);
  color: white;
}

.contact-cta-primary:hover {
  background-color: var(--hover-color);
}

.contact-cta-secondary {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.contact-cta-secondary:hover {
  background-color: var(--primary-color);
  color: white;
}

.contact-cta-social {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.contact-cta-social a {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.contact-cta-social a:hover {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .contact-cta {
    padding: 2rem 1rem;
  }

  .contact-cta-links {
    flex-direction: column;
    align-items: center;
  }

  .contact-cta-btn {
    width: 100%;
    max-width: 280px;
    text-align: center;
  }
}
```

### Step 3: Create index.ts barrel export

**File:** `frontend/src/components/sections/ContactCTA/index.ts` (NEW)

```typescript
export { ContactCTA } from "./ContactCTA";
```

### Step 4: Show footer on homepage

**File:** `frontend/src/components/layout/Layout/Layout.tsx`

**Before (line 35):**

```tsx
{
  /* Footer on all pages except home */
}
{
  !isHomePage && <Footer />;
}
```

**After:**

```tsx
{
  /* Footer on all pages */
}
<Footer />;
```

### Step 5: Add ContactCTA to HomePage

**File:** `frontend/src/pages/Home/HomePage.tsx`

**Add import** after line 32 (after ActionButtons import):

```tsx
import { ContactCTA } from "../../components/sections/ContactCTA";
```

**Add ContactCTA** after the ActionButtons section (after line 312, before the closing `</div>`):

**Before (lines 304-313):**

```tsx
        {/* Action Buttons */}
        {activeSection && (
          <ActionButtons
            onRegenerate={() => regenerate(true)}
            onReset={reset}
            isRegenerating={isRegenerating}
            hasModifiedContent={hasModifiedContent}
          />
        )}
      </div>
```

**After:**

```tsx
        {/* Action Buttons */}
        {activeSection && (
          <ActionButtons
            onRegenerate={() => regenerate(true)}
            onReset={reset}
            isRegenerating={isRegenerating}
            hasModifiedContent={hasModifiedContent}
          />
        )}

        {/* Contact CTA */}
        <ContactCTA />
      </div>
```

## Test Plan

### Unit Test

Create `frontend/src/components/sections/ContactCTA/__tests__/ContactCTA.test.tsx`:

```typescript
describe("ContactCTA", () => {
  it("renders the contact section with email and LinkedIn links", () => {
    // Mock useBio to return test data
    // Check that mailto: link exists
    // Check that LinkedIn link exists
  });

  it("renders social links from bio data", () => {
    // Check Spotify, Hoobe links render (GitHub is in footer, not CTA)
  });

  it("does not render when bio is null", () => {
    // Mock useBio returning null
    // Verify component returns nothing
  });
});
```

### E2E Test

Add to `frontend/e2e/home.spec.ts`:

```typescript
test("displays contact CTA section", async ({ page }) => {
  const cta = page.locator(".contact-cta");
  await expect(cta).toBeVisible({ timeout: 5000 });

  // Check that email link exists
  const emailLink = cta.locator('a[href^="mailto:"]');
  await expect(emailLink).toBeVisible();
});

test("homepage has footer", async ({ page }) => {
  const footer = page.locator("footer.footer");
  await expect(footer).toBeVisible({ timeout: 5000 });
});
```

## Documentation Updates

- No README changes needed
- New component added to `frontend/src/components/sections/ContactCTA/`

## Edge Cases

1. **Bio not loaded yet:** Component returns `null` when `bio` is falsy
2. **Missing social links:** Each social link checks existence with `&&` before rendering
3. **Email client not configured:** `mailto:` links are standard web behavior; no special handling needed

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] ContactCTA visible on homepage below content sections
- [ ] Email button opens mailto: link
- [ ] LinkedIn button opens in new tab
- [ ] Social links render from bio.yaml data
- [ ] Footer now visible on homepage
- [ ] Dark mode rendering correct
- [ ] Mobile responsive (buttons stack vertically)
- [ ] Footer appears on all pages (not just non-home)

## What NOT To Do

- **Don't add a full contact form** - just links for now (keep it simple)
- **Don't use em-dashes** in the copy
- **Don't make the CTA aggressive or corporate** - "let's connect" not "CONTACT ME NOW"
- **Don't duplicate social links** - the CTA and footer should feel complementary, not redundant
- **Don't remove the email from the header** - keep it there too; multiple touchpoints are good
