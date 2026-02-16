# Phase 05: Enhance Music Section

## PR Title

**enhance: music section with personal intro, instagram link, and polished layout**

## Status: ✅ COMPLETE

Completed: 2026-02-16

## Metadata

| Field                | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Risk Level**       | Low                                                            |
| **Estimated Effort** | 1-2 hours                                                      |
| **Files Modified**   | 2 (`Music.tsx`, `Music.css`)                                   |
| **Files Added**      | 1 (`Music.test.tsx`)                                           |
| **Dependencies**     | None (Phase 04 establishes animation pattern but not required) |

## Overview

Add a brief personal intro, include the music Instagram link, restyle links as compact pill buttons, and add staggered Framer Motion entrance animation. Keep it understated - the user explicitly said it shouldn't overwhelm the professional feel.

## Changes

### 1. Music.tsx — Restructure component

**Before:**

```tsx
import { useBio } from "../../../store";
import "./Music.css";

const LINKS = {
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
  hoobe: "https://hoo.be/crog",
} as const;

export function Music() {
  const bio = useBio();
  return (
    <section className="music-section">
      <div className="links-grid">
        <a
          href={bio?.social_links?.spotify || LINKS.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="portfolio-link"
        >
          <i className="fab fa-spotify"></i>
          <div>
            <span className="link-title">Spotify</span>
            <span className="link-description">
              Listen to my music on Spotify
            </span>
          </div>
        </a>
        <a
          href={bio?.social_links?.hoobe || LINKS.hoobe}
          target="_blank"
          rel="noopener noreferrer"
          className="portfolio-link"
        >
          <i className="fas fa-link"></i>
          <div>
            <span className="link-title">Music Links</span>
            <span className="link-description">Find me on other platforms</span>
          </div>
        </a>
      </div>
      <div className="spotify-embed">
        <iframe
          src="https://open.spotify.com/embed/artist/0UotSScPTiSFPmbmjam2jn?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
        ></iframe>
      </div>
    </section>
  );
}
```

**After:**

```tsx
import { motion } from "framer-motion";
import { useBio } from "../../../store";
import { staggerContainer, staggerItem } from "../../../utils/animations";
import "./Music.css";

const LINKS = {
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
  hoobe: "https://hoo.be/crog",
  instagram_music: "https://instagram.com/crogmusic",
} as const;

export function Music() {
  const bio = useBio();

  const spotifyUrl = bio?.social_links?.spotify || LINKS.spotify;
  const hoobeUrl = bio?.social_links?.hoobe || LINKS.hoobe;
  const instagramMusicUrl =
    bio?.social_links?.instagram_music || LINKS.instagram_music;

  return (
    <motion.section
      className="music-section"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.p className="music-intro" variants={staggerItem}>
        i make electronic music under the name{" "}
        <span className="music-artist-name">crog</span>. here's some of what
        i've been working on.
      </motion.p>

      <motion.div className="music-links" variants={staggerItem}>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="Spotify"
        >
          <i className="fab fa-spotify"></i>
          <span>Spotify</span>
        </a>
        <a
          href={instagramMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="@crogmusic"
        >
          <i className="fab fa-instagram"></i>
          <span>@crogmusic</span>
        </a>
        <a
          href={hoobeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="all music links"
        >
          <i className="fas fa-link"></i>
          <span>all links</span>
        </a>
      </motion.div>

      <motion.div className="spotify-embed" variants={staggerItem}>
        <iframe
          src="https://open.spotify.com/embed/artist/0UotSScPTiSFPmbmjam2jn?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
        ></iframe>
      </motion.div>
    </motion.section>
  );
}
```

**Key decisions:**

- Intro text is hardcoded (not YAML) so Fantasy Mode regeneration won't mangle it
- "crog" gets `--primary-color` highlight via `.music-artist-name`
- Links use compact pill style instead of full-width portfolio-link cards
- Instagram music link added from bio.yaml social_links
- Hoobe label changed from "Music Links" to "all links" (more casual)
- Framer Motion uses existing `staggerContainer`/`staggerItem` from `utils/animations.ts`

### 2. Music.css — Add component styles

**Replace contents of** `frontend/src/components/sections/Music/Music.css`:

```css
/* Music section intro text */
.music-intro {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color-secondary);
  margin: 0;
  max-width: 480px;
}

.music-artist-name {
  color: var(--primary-color);
  font-weight: 600;
}

/* Compact link row */
.music-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.music-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  text-decoration: none;
  transition:
    color 0.2s,
    border-color 0.2s,
    transform 0.2s;
}

.music-link:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  text-decoration: none;
}

.music-link i {
  font-size: 1rem;
  color: inherit;
}

/* Responsive */
@media (max-width: 768px) {
  .music-intro {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .music-links {
    flex-direction: column;
  }

  .music-link {
    justify-content: center;
  }
}
```

**Styling rationale:**

- Pill-shaped links (border-radius 2rem) feel softer/more casual than boxy cards
- Uses all CSS variables - dark mode works automatically
- Hover uses `--primary-color` consistent with rest of site
- Links stack vertically at 480px for mobile tapping

### 3. Unit Test (new file)

**File**: `frontend/src/components/sections/Music/__tests__/Music.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect, beforeEach } from "vitest";
import { Music } from "../Music";
import { useContentStore } from "../../../../store";

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

const mockBio = {
  display_name: "Test User",
  email: "test@example.com",
  location: "New York",
  about_text: "About me",
  welcome_message: "Hello",
  social_links: {
    github: "https://github.com/testuser",
    linkedin: "https://linkedin.com/in/testuser",
    spotify: "https://open.spotify.com/artist/testid",
    hoobe: "https://hoo.be/test",
    instagram_music: "https://instagram.com/crogmusic",
  },
};

describe("Music", () => {
  beforeEach(() => {
    useContentStore.setState({ bio: null });
  });

  it("renders intro text with artist name", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    expect(screen.getByText(/electronic music/i)).toBeInTheDocument();
    expect(screen.getByText("crog")).toBeInTheDocument();
  });

  it("renders Spotify link with correct URL", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByLabelText("Spotify");
    expect(link).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/testid",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders Instagram music link", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByLabelText("@crogmusic");
    expect(link).toHaveAttribute("href", "https://instagram.com/crogmusic");
  });

  it("renders Hoobe link", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByLabelText("all music links");
    expect(link).toHaveAttribute("href", "https://hoo.be/test");
  });

  it("renders Spotify embed", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    expect(screen.getByTitle("Spotify Player")).toBeInTheDocument();
  });

  it("uses fallback URLs when bio is null", () => {
    render(<Music />);
    const link = screen.getByLabelText("Spotify");
    expect(link).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
    );
  });
});
```

## Test Plan

1. `cd frontend && npm run build` - TypeScript + build
2. `cd frontend && npm run test:run` - All unit tests including new Music tests
3. `cd frontend && npm run lint` - ESLint
4. Visual: Desktop - intro text, 3 pill links, Spotify embed, feels understated
5. Visual: Mobile 480px - links stack vertically, intro wraps
6. Visual: Dark mode - all CSS variables resolve correctly
7. All 3 links open correct URLs in new tabs
8. Staggered animation on section mount

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] `npm run lint` passes
- [ ] Intro text visible with "crog" highlighted
- [ ] 3 links: Spotify, @crogmusic, all links
- [ ] Links have correct URLs from bio.yaml
- [ ] Spotify embed renders and plays
- [ ] Dark mode looks correct
- [ ] Mobile layout stacks links vertically
- [ ] Staggered entrance animation works

## What NOT to Do

1. **Do NOT add music content to bio.yaml.** Intro text is structural UI copy, not regeneratable.
2. **Do NOT build a full artist page.** No album art grids, track lists, or play counts. User wants understated.
3. **Do NOT use em-dashes.** Per CLAUDE.md tone guidelines.
4. **Do NOT remove existing `.music-section`/`.spotify-embed` styles from App.css.** Music.css layers on top.
5. **Do NOT change the Spotify embed URL or configuration.**
6. **Do NOT modify Portfolio.tsx.** It's dead code (not imported anywhere).
7. **Do NOT add new npm dependencies.** Font Awesome icons already available.
