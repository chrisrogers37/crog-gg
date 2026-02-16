# Phase 06: Image Showcase Strip

## PR Title

**feat: add ambient image showcase marquee to fill desktop whitespace**

## Status: ✅ COMPLETE

Completed: 2026-02-16

## Metadata

| Field                | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Risk Level**       | Low                                                            |
| **Estimated Effort** | 1-2 hours                                                      |
| **Files Modified**   | 3 (`HomePage.tsx`, `common/index.ts`, `types/index.ts`)        |
| **Files Added**      | 7 (component, CSS, tests, loader, YAML, type, barrel)          |
| **Dependencies**     | None (Phase 04 establishes animation pattern but not required) |

## Overview

On desktop viewports (1440px), the home page has significant whitespace between the About section preview (capped at 180px with a "see more" fade) and the ContactCTA at the bottom. This dead space makes the page feel sparse and unfinished.

The solution is a horizontal band of personal photos that continuously auto-scrolls like a film strip. It fills horizontal space elegantly, works with as few as 5 images, adds ambient motion, and creates a visual bridge between content and the footer CTA.

## Visual Specification

### Layout (Desktop, 1440px)

```
+--------------------------------------------------+
|  [header] [profile photo] [name] [typewriter]     |
|  [section nav tabs]                                |
|  [About preview, 180px, fade + "see more"]         |
|                                                    |
|  ---- IMAGE SHOWCASE STRIP (full bleed) --------  |
|  |  [photo] [photo] [photo] [photo] [photo] ... | |
|  ------------------------------------------------  |
|                                                    |
|  [ContactCTA: "connect w/ me"]                     |
+--------------------------------------------------+
```

### Sizing

- **Individual image dimensions:** 140x140px on desktop (rounded-rect with 12px border-radius), 100x100px on tablet, 80x80px on mobile
- **Gap between images:** 1.5rem (24px) on desktop, 1rem on tablet, 0.75rem on mobile
- **Vertical padding:** 2rem top and bottom on desktop, 1.5rem on tablet, 1rem on mobile
- **Border separator:** `border-top: 1px solid var(--border-color)` matches ContactCTA separator style

### Visual Treatment

- Images are `object-fit: cover` with rounded rectangles (border-radius: 12px)
- Subtle box-shadow: `0 2px 8px rgba(0, 0, 0, 0.1)` (light mode), `0 2px 8px rgba(0, 0, 0, 0.3)` (dark mode)
- On hover: scroll animation pauses, hovered image scales up (1.05) with deeper shadow
- Dark mode shadow enhancement automatically handled

### Animation

- CSS `@keyframes` marquee scroll from 0 to negative half of total strip width
- Image set is **duplicated in the DOM** for seamless infinite loop (standard CSS marquee technique)
- Speed: `calc(var(--image-count, 5) * 5s)` per cycle (5 seconds per image)
- Direction: right to left
- Pause on hover: `animation-play-state: paused` on `.image-showcase:hover`
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables animation, shows static scrollable row
- Entrance: Framer Motion `whileInView` fade+slide (matching ContactCTA pattern)

## Changes

### 1. New YAML config file

**File**: `frontend/public/content/showcase.yaml`

```yaml
# Showcase images for the marquee strip
# Add or remove entries to change what appears in the photo strip
images:
  - src: /profile-photos/photo-1.jpg
    alt: photo of chris
  - src: /profile-photos/photo-2.jpg
    alt: photo of chris
  - src: /profile-photos/photo-3.jpg
    alt: photo of chris
  - src: /profile-photos/photo-4.jpg
    alt: photo of chris
  - src: /profile-photos/photo-5.jpg
    alt: photo of chris
```

Uses existing profile photos as the initial image set. Lives in `public/content/` so Vite serves it automatically (no vite.config.ts change needed).

### 2. Type definition

**New file**: `frontend/src/types/Showcase.ts`

```typescript
export type ShowcaseImage = {
  src: string;
  alt: string;
};
```

**Modify**: `frontend/src/types/index.ts` - add export:

```typescript
export type { ShowcaseImage } from "./Showcase";
```

### 3. Showcase loader utility

**New file**: `frontend/src/utils/showcaseLoader.ts`

```typescript
import yaml from "js-yaml";

type ShowcaseImage = {
  src: string;
  alt: string;
};

type ShowcaseData = {
  images: ShowcaseImage[];
};

export const loadShowcase = async (): Promise<ShowcaseImage[]> => {
  try {
    const response = await fetch("/content/showcase.yaml");
    if (!response.ok) {
      throw new Error(`Failed to fetch showcase.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const data = yaml.load(content) as ShowcaseData;
    return data.images || [];
  } catch (error) {
    console.error("Error loading showcase from YAML:", error);
    return [];
  }
};
```

**Key decision:** Returns empty array on failure rather than throwing. The showcase is decorative -- a failure should never block the page.

### 4. ImageShowcase component

**New file**: `frontend/src/components/common/ImageShowcase/ImageShowcase.tsx`

```tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loadShowcase } from "../../../utils/showcaseLoader";
import type { ShowcaseImage } from "../../../types/Showcase";
import "./ImageShowcase.css";

type ImageShowcaseProps = {
  /** Override images instead of loading from YAML (useful for testing) */
  images?: ShowcaseImage[];
};

export function ImageShowcase({ images: propImages }: ImageShowcaseProps) {
  const [images, setImages] = useState<ShowcaseImage[]>(propImages || []);

  useEffect(() => {
    if (!propImages) {
      loadShowcase().then(setImages);
    }
  }, [propImages]);

  // Don't render if no images or fewer than 3
  if (images.length < 3) return null;

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...images, ...images];

  return (
    <motion.div
      className="image-showcase"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      aria-label="Photo showcase"
      role="presentation"
    >
      <div
        className="image-showcase-track"
        style={
          {
            "--image-count": images.length,
          } as React.CSSProperties
        }
      >
        {duplicatedImages.map((image, index) => (
          <div className="image-showcase-item" key={`${image.src}-${index}`}>
            <img
              src={image.src}
              alt={image.alt}
              className="image-showcase-photo"
              loading="lazy"
              width={140}
              height={140}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
```

**Key decisions:**

- `images` prop override allows testing without YAML loading
- Minimum 3 images check - marquee looks bad with fewer
- Duplicated images array - standard CSS marquee technique: track contains images twice, animation translates exactly 50% of total width for seamless loop
- `loading="lazy"` since showcase is below the fold
- `role="presentation"` since these are decorative images
- CSS custom property `--image-count` drives animation duration calculation

### 5. ImageShowcase CSS

**New file**: `frontend/src/components/common/ImageShowcase/ImageShowcase.css`

```css
.image-showcase {
  padding: 2rem 0;
  margin-top: 2rem;
  overflow: hidden;
  border-top: 1px solid var(--border-color);
}

.image-showcase-track {
  display: flex;
  gap: 1.5rem;
  animation: marquee-scroll calc(var(--image-count, 5) * 5s) linear infinite;
  width: max-content;
}

.image-showcase:hover .image-showcase-track {
  animation-play-state: paused;
}

.image-showcase-item {
  flex-shrink: 0;
}

.image-showcase-photo {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.image-showcase-photo:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Dark mode shadow enhancement */
.dark .image-showcase-photo {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark .image-showcase-photo:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

@keyframes marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* Reduced motion: disable animation, allow manual horizontal scroll */
@media (prefers-reduced-motion: reduce) {
  .image-showcase-track {
    animation: none;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .image-showcase {
    overflow-x: auto;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .image-showcase {
    padding: 1.5rem 0;
    margin-top: 1.5rem;
  }

  .image-showcase-track {
    gap: 1rem;
  }

  .image-showcase-photo {
    width: 100px;
    height: 100px;
    border-radius: 10px;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .image-showcase {
    padding: 1rem 0;
    margin-top: 1rem;
  }

  .image-showcase-track {
    gap: 0.75rem;
  }

  .image-showcase-photo {
    width: 80px;
    height: 80px;
    border-radius: 8px;
  }
}
```

**CSS rationale:**

- `translateX(-50%)` for keyframe: since images are duplicated, moving exactly half creates seamless loop
- `calc(var(--image-count, 5) * 5s)` for duration: 5 seconds per image, consistent perceived speed regardless of image count
- `width: max-content` on track allows flex row to extend beyond container
- `overflow: hidden` on container clips the extended track

### 6. Barrel exports

**New file**: `frontend/src/components/common/ImageShowcase/index.ts`

```typescript
export { ImageShowcase } from "./ImageShowcase";
```

**Modify**: `frontend/src/components/common/index.ts` - add line:

```typescript
export { ImageShowcase } from "./ImageShowcase";
```

### 7. Integrate into HomePage

**File**: `frontend/src/pages/Home/HomePage.tsx`

**Add import** alongside other common component imports:

```typescript
import { ImageShowcase } from "../../components/common/ImageShowcase";
```

**Place component** between the ActionButtons section and the ContactCTA section (around line 308):

```tsx
{/* Action Buttons */}
{activeSection && !previewMode && (
  <ActionButtons ... />
)}

{/* Image Showcase */}
<ImageShowcase />

{/* Contact CTA */}
<ContactCTA />
```

The showcase appears in **both** preview mode and expanded section mode - it is always visible below the main content area. This placement fills the whitespace between the short preview and the CTA.

### 8. Unit Tests

**New file**: `frontend/src/components/common/ImageShowcase/__tests__/ImageShowcase.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect } from "vitest";
import { ImageShowcase } from "../ImageShowcase";

beforeAll(() => {
  window.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
});

const mockImages = [
  { src: "/profile-photos/photo-1.jpg", alt: "photo one" },
  { src: "/profile-photos/photo-2.jpg", alt: "photo two" },
  { src: "/profile-photos/photo-3.jpg", alt: "photo three" },
  { src: "/profile-photos/photo-4.jpg", alt: "photo four" },
  { src: "/profile-photos/photo-5.jpg", alt: "photo five" },
];

describe("ImageShowcase", () => {
  it("renders images when provided via props", () => {
    render(<ImageShowcase images={mockImages} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(10); // 5 original + 5 duplicated
  });

  it("renders with correct alt text", () => {
    render(<ImageShowcase images={mockImages} />);
    const firstImage = screen.getAllByAltText("photo one");
    expect(firstImage.length).toBeGreaterThan(0);
  });

  it("does not render when fewer than 3 images", () => {
    const twoImages = mockImages.slice(0, 2);
    const { container } = render(<ImageShowcase images={twoImages} />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when images is empty", () => {
    const { container } = render(<ImageShowcase images={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("has presentation role for accessibility", () => {
    render(<ImageShowcase images={mockImages} />);
    const showcase = screen.getByRole("presentation");
    expect(showcase).toBeInTheDocument();
  });

  it("uses lazy loading for images", () => {
    render(<ImageShowcase images={mockImages} />);
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  it("sets --image-count CSS custom property", () => {
    render(<ImageShowcase images={mockImages} />);
    const track = document.querySelector(".image-showcase-track");
    expect(track).toHaveStyle({ "--image-count": "5" });
  });
});
```

### 9. E2E Test Addition

**Modify**: `frontend/e2e/home.spec.ts` - add at end:

```typescript
test.describe("Image Showcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays image showcase strip", async ({ page }) => {
    const showcase = page.locator(".image-showcase");
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase).toBeVisible({ timeout: 5000 });
  });

  test("showcase contains images", async ({ page }) => {
    const images = page.locator(".image-showcase-photo");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
```

## Responsive Behavior

| Viewport           | Image Size  | Gap     | Behavior                               |
| ------------------ | ----------- | ------- | -------------------------------------- |
| Desktop (>768px)   | 140x140     | 1.5rem  | Auto-scroll marquee, pause on hover    |
| Tablet (481-768px) | 100x100     | 1rem    | Auto-scroll marquee, pause on hover    |
| Mobile (<=480px)   | 80x80       | 0.75rem | Auto-scroll marquee, pause on hover    |
| Reduced motion     | Same sizing | Same    | Static row, horizontal scroll overflow |

## Accessibility Checklist

- [x] Each image has configurable alt text from YAML
- [x] `prefers-reduced-motion: reduce` disables CSS animation, shows static scrollable row
- [x] Outer container has `role="presentation"` and `aria-label="Photo showcase"`
- [x] No interactive elements (no keyboard trap concerns)
- [x] Uses `var(--border-color)` which is already accessible in both themes
- [x] No focusable elements, no focus management needed

## Test Plan

1. `cd frontend && npm run build` - TypeScript + build
2. `cd frontend && npm run test:run` - All unit tests including new ImageShowcase tests
3. `cd frontend && npm run lint` - ESLint
4. `cd frontend && npm run test:e2e` - E2E tests including new showcase test
5. Visual: Desktop 1440px - showcase fills whitespace between About preview and ContactCTA
6. Visual: Tablet 768px - images resize to 100x100, strip still scrolls
7. Visual: Mobile 375px - images resize to 80x80, strip still scrolls
8. Dark mode: images have appropriate shadow adjustment
9. Hover on an image: animation pauses, hovered image scales slightly
10. `prefers-reduced-motion: reduce`: animation stops, images display as static row

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:e2e` passes
- [ ] Desktop: showcase fills whitespace between About preview and ContactCTA
- [ ] Tablet: images resize, strip still scrolls
- [ ] Mobile: images resize, strip still scrolls
- [ ] Dark mode looks correct
- [ ] Hover pauses animation, scales hovered image
- [ ] Reduced motion: static scrollable row
- [ ] Lazy loading confirmed in DevTools
- [ ] No TypeScript `any` types used
- [ ] No new dependencies added

## File Summary

| Action | File                                                                            | Purpose                    |
| ------ | ------------------------------------------------------------------------------- | -------------------------- |
| NEW    | `frontend/public/content/showcase.yaml`                                         | Image list configuration   |
| NEW    | `frontend/src/types/Showcase.ts`                                                | ShowcaseImage type         |
| NEW    | `frontend/src/utils/showcaseLoader.ts`                                          | YAML loader utility        |
| NEW    | `frontend/src/components/common/ImageShowcase/ImageShowcase.tsx`                | Main component             |
| NEW    | `frontend/src/components/common/ImageShowcase/ImageShowcase.css`                | Styles + marquee animation |
| NEW    | `frontend/src/components/common/ImageShowcase/index.ts`                         | Barrel export              |
| NEW    | `frontend/src/components/common/ImageShowcase/__tests__/ImageShowcase.test.tsx` | Unit tests                 |
| MODIFY | `frontend/src/components/common/index.ts`                                       | Add ImageShowcase export   |
| MODIFY | `frontend/src/pages/Home/HomePage.tsx`                                          | Integrate ImageShowcase    |
| MODIFY | `frontend/src/types/index.ts`                                                   | Export ShowcaseImage type  |
| MODIFY | `frontend/e2e/home.spec.ts`                                                     | Add E2E test               |

## What NOT to Do

1. **Do NOT build a full photo gallery.** This is a decorative ambient strip, not an interactive gallery with lightboxes, captions, navigation, or upload functionality.
2. **Do NOT use heavy unoptimized images.** For dedicated showcase photos, aim for <200KB each.
3. **Do NOT use JavaScript-driven animation (requestAnimationFrame, setInterval).** Pure CSS `@keyframes` is more performant and GPU-composited.
4. **Do NOT make the showcase the visual focus of the page.** It should be ambient and subtle - noticed but not distracting.
5. **Do NOT use `enum` or `interface`** - use `type` and string literal unions per project conventions.
6. **Do NOT add Framer Motion for the scroll animation.** Use pure CSS for the marquee; Framer Motion is only for the entrance animation.
7. **Do NOT add a "view all photos" or gallery expansion.** That's a separate feature.
8. **Do NOT put showcase images in `src/`.** They belong in `public/` for static serving.
9. **Do NOT modify vite.config.ts.** Files in `public/content/` are served automatically by Vite.
