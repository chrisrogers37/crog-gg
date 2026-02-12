# Mobile Optimization Plan - Choose Your Own Chris

## Overview

This document provides a comprehensive, technically detailed plan for optimizing the mobile experience of crog.gg. Each item references specific files, CSS selectors, and code locations. The plan is organized by priority (P0 = critical, P1 = high, P2 = medium, P3 = nice-to-have).

Based on the current mobile screenshot, the primary issues are:

1. The header area (profile photo + name + typewriter) consumes excessive vertical space above the fold
2. Section content padding/spacing is too generous for small screens
3. Touch targets in the section nav and hamburger are borderline small
4. The overall "card in a page" layout wastes horizontal space on mobile
5. Several interactive components lack mobile-optimized sizing

---

## P0 - Critical: Above-the-Fold & First Impression

### 1. Reduce Header Vertical Footprint on Mobile

**Problem:** The header takes up most of the viewport on mobile. The profile photo (140px at 480px / 180px at 768px), name, tagline, typewriter message, and location all stack vertically, pushing the section nav and content far below the fold.

**Files to modify:**

- `frontend/src/App.css` (lines 63-81, 321-393, 480-496, 943-962)
- `frontend/src/pages/Home/HomePage.css` (lines 44-48, 84-102)
- `frontend/src/pages/Home/HomePage.tsx` (lines 196-233)

**Changes:**

#### 1a. Switch to horizontal header layout on mobile (side-by-side photo + text)

Currently at 768px the header switches to `flex-direction: column` (App.css:333-338). Instead, keep it as `flex-direction: row` on mobile with a smaller photo:

```css
/* In App.css, REPLACE the 768px media query for .header-content */
@media (max-width: 768px) {
  .header-content {
    flex-direction: row; /* Keep horizontal, NOT column */
    align-items: center; /* Vertically center */
    text-align: left; /* Keep left-aligned */
    gap: 1rem; /* Tighter gap */
    padding: 0;
  }
}
```

#### 1b. Drastically reduce profile photo size on mobile

```css
/* In App.css, REPLACE existing profile-photo media queries (lines 943-962) */
@media (max-width: 768px) {
  .profile-photo {
    width: 80px; /* Was 180px */
    height: 80px; /* Was 180px */
  }
}

@media (max-width: 480px) {
  .profile-photo {
    width: 64px; /* Was 140px */
    height: 64px; /* Was 140px */
  }
}

/* Remove the 360px breakpoint entirely - 64px is small enough */
```

#### 1c. Reduce header text spacing on mobile

```css
/* In App.css, ADD to the 768px media query */
@media (max-width: 768px) {
  header {
    text-align: left; /* Was center */
    padding: 0;
    margin-bottom: 1rem; /* Was 2rem */
    gap: 0.5rem; /* Was 1rem */
  }

  .header-text {
    gap: 0.25rem; /* Was 0.5rem */
  }

  h1 {
    font-size: clamp(1.25rem, 4vw, 1.75rem); /* Smaller range on mobile */
  }
}
```

#### 1d. Hide the tagline on very small screens

```css
/* In HomePage.css, ADD */
@media (max-width: 480px) {
  .header-tagline {
    display: none;
  }
}
```

#### 1e. Compact the welcome/typewriter area

```css
/* In App.css, ADD */
@media (max-width: 768px) {
  .welcome-message {
    margin-top: 0.5rem; /* Was 1rem */
    padding-top: 0.25rem; /* Was 0.5rem */
  }

  .welcome-typewriter {
    font-size: 0.8rem; /* Was 0.9rem */
    line-height: 1.3; /* Was 1.4 */
  }
}

@media (max-width: 480px) {
  .welcome-message {
    margin-top: 0.25rem;
    padding-top: 0;
    border-top: none; /* Remove the border separator */
  }

  .welcome-typewriter {
    font-size: 0.75rem;
  }
}
```

#### 1f. Hide location/contact-subtle on very small screens

```css
/* In HomePage.css, ADD */
@media (max-width: 480px) {
  .contact-subtle {
    display: none;
  }
}
```

**Expected result:** Header shrinks from ~60-70% of viewport to ~25-30%, allowing section nav and content to appear above the fold.

---

### 2. Improve Section Navigation Touch Targets & Stickiness

**Problem:** Section nav buttons are too small at 480px (0.5rem 0.75rem padding = ~32px touch height). The sticky nav also has no visual separation from content when scrolled.

**Files to modify:**

- `frontend/src/App.css` (lines 964-1010, 1012-1063, 1119-1123)
- `frontend/src/components/SectionNav.tsx` (lines 85-113)

**Changes:**

#### 2a. Increase touch target size for section nav buttons

```css
/* In App.css, REPLACE the 480px .section-nav-button rule (line 1120-1122) */
@media (max-width: 480px) {
  .section-nav-button {
    padding: 0.625rem 1rem; /* Was 0.5rem 0.75rem - now 40px+ height */
    font-size: 0.85rem; /* Slightly larger for readability */
    min-height: 44px; /* Apple HIG minimum touch target */
  }
}
```

#### 2b. Make the section nav full-bleed on mobile

The section nav currently inherits padding from the home-page container. On mobile, it should stretch edge-to-edge:

```css
/* In App.css, ADD */
@media (max-width: 768px) {
  .section-nav {
    margin-left: -1rem; /* Negate parent padding */
    margin-right: -1rem;
    padding: 0.5rem 1rem;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .section-nav {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    padding: 0.5rem 0.5rem;
  }
}
```

#### 2c. Add a stronger bottom shadow when scrolled (visual separator)

```css
/* In App.css, REPLACE .section-nav shadow */
.section-nav {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Existing */
}

/* ADD: Stronger shadow on mobile for better visual separation */
@media (max-width: 768px) {
  .section-nav {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
```

---

### 3. Remove Box-Shadow "Card in a Page" Layout on Mobile

**Problem:** The `.home-page` has `box-shadow: 0 0 20px rgba(0, 0, 0, 0.1)` and `max-width: 800px`. On mobile this is already removed at 768px, but the background color difference between body and card is still visible, wasting perceived horizontal space.

**Files to modify:**

- `frontend/src/pages/Home/HomePage.css` (lines 1-13, 90-96)
- `frontend/src/App.css` (lines 24-34)

**Changes:**

```css
/* In HomePage.css, REPLACE the 768px media query (lines 90-96) */
@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
    margin: 0;
    box-shadow: none;
    max-width: 100%; /* Remove max-width constraint */
    border-radius: 0; /* Remove any rounding */
  }
}

@media (max-width: 480px) {
  .home-page {
    padding: 0.75rem; /* Was 0.5rem - slightly more breathing room */
  }
}
```

Also ensure the body background matches the card background on mobile so there's no wasted border:

```css
/* In App.css, ADD */
@media (max-width: 768px) {
  body {
    background-color: var(--card-background);
  }
}
```

---

## P1 - High: Content Section Mobile Optimization

### 4. Optimize Content Section Padding & Spacing

**Problem:** `.section-content` has 1rem padding on 768px (was 2rem), but additional nested padding from `.about-section` (1rem) creates double-padding. Similarly, `.content-section` padding adds to the total.

**Files to modify:**

- `frontend/src/App.css` (lines 231-237, 372-384, 395-407, 1064-1087)

**Changes:**

```css
/* In App.css, consolidate section content padding */
@media (max-width: 768px) {
  .section-content {
    padding: 0.75rem; /* Reduce from 1rem */
    margin: 0;
    border-radius: 0;
  }

  .content-section {
    padding: 0.5rem; /* Reduce from 1rem */
  }

  .about-section {
    padding: 0.5rem; /* Reduce from 1rem */
  }
}

@media (max-width: 480px) {
  .section-content {
    padding: 0.5rem;
  }

  .content-section {
    padding: 0.25rem;
  }

  .about-section {
    padding: 0.25rem;
  }
}
```

---

### 5. Optimize the Timeline/Journey Section for Mobile

**Problem:** The timeline uses a center-aligned two-column layout with alternating left/right cards. At 768px it switches to single-column left-aligned, but the timeline dot at `left: 1.25rem` and `padding-left: 3.5rem` wastes space. The skills sidebar also appears above the timeline on mobile (order: -1) which pushes actual content down.

**Files to modify:**

- `frontend/src/components/sections/Timeline/Timeline.css` (lines 168-214)
- `frontend/src/components/sections/Timeline/Timeline.tsx` (lines 97-148)

**Changes:**

#### 5a. Tighten the timeline mobile layout

```css
/* In Timeline.css, REPLACE the 768px media query */
@media (max-width: 768px) {
  .timeline-layout {
    grid-template-columns: 1fr;
    gap: 1rem; /* Was 2rem */
  }

  .timeline-line {
    left: 0.75rem; /* Was 1.25rem - closer to edge */
  }

  .timeline-left,
  .timeline-right {
    padding-left: 2.5rem; /* Was 3.5rem */
    padding-right: 0;
    flex-direction: row;
  }

  .timeline-left .timeline-card,
  .timeline-right .timeline-card {
    text-align: left;
    max-width: 100%;
    margin-left: 0;
  }

  .timeline-dot {
    left: 0.75rem; /* Match timeline-line */
    width: 1.75rem; /* Was 2.5rem */
    height: 1.75rem; /* Was 2.5rem */
  }

  .timeline-icon {
    font-size: 0.8rem; /* Was 1rem */
  }

  /* Move skills sidebar below the timeline on mobile */
  .timeline-skills-sidebar {
    order: 1; /* Was -1 (above). Put below instead */
    margin-top: 1rem;
    margin-bottom: 0;
  }

  .timeline-skills-sticky {
    position: relative;
    top: 0;
  }
}
```

#### 5b. Make timeline cards more compact on small mobile

```css
/* In Timeline.css, REPLACE the 480px media query */
@media (max-width: 480px) {
  .timeline-entry {
    margin-bottom: 1rem; /* Was 1.5rem */
  }

  .timeline-card {
    padding: 0.5rem 0.75rem; /* Was 0.75rem 1rem */
  }

  .timeline-title {
    font-size: 0.9rem; /* Was 1rem */
  }

  .timeline-one-liner {
    font-size: 0.8rem; /* Was 0.9rem */
  }

  .timeline-period {
    font-size: 0.7rem; /* Was 0.8rem */
  }
}
```

---

### 6. Optimize the Projects Section Cards for Mobile

**Problem:** The projects grid on the home page uses `grid-template-columns: repeat(2, 1fr)` and switches to `1fr` at 768px. The project cards have gradient image headers (120px tall) that waste space on mobile. Featured cards span 2 columns on desktop but 1 on mobile - good, but the card height is still tall.

**Files to modify:**

- `frontend/src/components/sections/Projects/Projects.css` (lines 126-134)
- `frontend/src/components/sections/Projects/ProjectCard.tsx`

**Changes:**

```css
/* In Projects.css, ADD to the 768px media query or ADD new */
@media (max-width: 768px) {
  .project-card-image {
    height: 80px; /* Was 120px */
  }

  .project-card-featured .project-card-image {
    height: 100px; /* Was 160px */
  }

  .project-card-body {
    padding: 0.75rem; /* Was 1rem */
  }

  .project-card-title {
    font-size: 0.9rem; /* Was 1rem */
  }

  .project-card-description {
    font-size: 0.8rem; /* Was 0.875rem */
    -webkit-line-clamp: 1; /* Was 2 - save vertical space */
  }
}
```

---

### 7. Optimize the Music Section Spotify Embed

**Problem:** The Spotify iframe has a fixed `height="352"` which is quite tall on a mobile viewport (~50% of screen height on most phones).

**Files to modify:**

- `frontend/src/components/sections/Music/Music.tsx` (line 49)
- `frontend/src/components/sections/Music/Music.css`

**Changes:**

Option A (CSS override - preferred, no JSX change):

```css
/* In Music.css, ADD */
@media (max-width: 768px) {
  .spotify-embed iframe {
    height: 152px; /* Compact player height - shows controls only */
  }
}

@media (max-width: 480px) {
  .spotify-embed {
    padding: 0.5rem; /* Was 1rem */
  }
}
```

Option B (responsive attribute in TSX):
In `Music.tsx`, change the iframe height to use a CSS variable or smaller default.

---

### 8. Optimize the About/Bio Section

**Problem:** The bio text uses `font-size: 1.1rem` with `line-height: 1.7`, making it quite spacious on mobile.

**Files to modify:**

- `frontend/src/App.css` (lines 435-450)

**Changes:**

```css
/* In App.css, ADD */
@media (max-width: 768px) {
  .bio {
    font-size: 0.95rem; /* Was 1.1rem */
    line-height: 1.6; /* Was 1.7 */
    margin-bottom: 1rem; /* Was 2rem */
  }

  .bio p {
    margin: 0 0 0.75rem 0; /* Was 0 0 1rem 0 */
  }
}

@media (max-width: 480px) {
  .bio {
    font-size: 0.9rem;
    line-height: 1.5;
  }
}
```

---

### 9. Optimize the Skills Word Cloud

**Problem:** The word cloud uses random font sizes from 12px-36px. On mobile, 36px skill tags can cause horizontal overflow or dominate the view.

**Files to modify:**

- `frontend/src/components/Skills.tsx` (lines 51-52)
- `frontend/src/App.css` (lines 1209-1235)

**Changes:**

#### 9a. Reduce max font size on mobile (requires component change)

In `Skills.tsx`, make font size range responsive:

```tsx
// Add a hook or media query check:
const isMobile = window.innerWidth <= 768;
const minFontSize = isMobile ? 10 : 12;
const maxFontSize = isMobile ? 24 : 36;
```

Better approach using a custom hook (create `frontend/src/hooks/useIsMobile.ts`):

```tsx
import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);

  return isMobile;
}
```

Then in `Skills.tsx`:

```tsx
const isMobile = useIsMobile();
const minFontSize = isMobile ? 10 : 12;
const maxFontSize = isMobile ? 24 : 36;
```

#### 9b. Tighten the word cloud CSS

```css
/* In App.css, ADD */
@media (max-width: 768px) {
  .word-cloud {
    gap: 0.5rem; /* Was 1rem */
    padding: 0.5rem; /* Was 1rem */
  }

  .skill-tag {
    padding: 0.35rem 0.75rem; /* Was 0.5rem 1rem */
  }

  .skills-container {
    padding: 1rem; /* Was 2rem */
  }
}
```

---

## P1 - High: Touch & Interaction Improvements

### 10. Increase All Touch Target Sizes

**Problem:** Several interactive elements are below the recommended 44x44px minimum (Apple HIG / WCAG 2.5.5).

**Files to modify:**

- Multiple CSS files (see specific fixes below)

**Changes:**

#### 10a. Hamburger button (home page)

```css
/* In HomePage.css, MODIFY .home-hamburger */
.home-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px; /* Was 4px */
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.75rem; /* Was 0.5rem - larger touch area */
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.home-hamburger-line {
  display: block;
  width: 22px; /* Was 20px */
  height: 2.5px; /* Was 2px */
  background: var(--text-color);
  border-radius: 1px;
}
```

#### 10b. Mobile menu close button

```css
/* In MobileMenu.css, MODIFY .mobile-menu-close (line 41-49) */
.mobile-menu-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 0.5rem; /* Was 0.25rem */
  min-width: 44px; /* ADD: minimum touch target */
  min-height: 44px; /* ADD: minimum touch target */
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
```

#### 10c. Mobile menu links and section buttons

```css
/* In MobileMenu.css, MODIFY .mobile-menu-link and .mobile-menu-section-btn */
.mobile-menu-link,
.mobile-menu-section-btn {
  display: block;
  padding: 0.75rem 0; /* Was 0.6rem 0 - bigger touch target */
  font-size: 1.05rem; /* Was 1rem */
  min-height: 44px; /* ADD: minimum touch target */
  /* rest stays the same */
}
```

#### 10d. Theme toggle

```css
/* In the ThemeToggle CSS, ensure minimum size */
.theme-toggle {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### 10e. "Up next" section navigator button

```css
/* In SectionNavigator.css, ADD */
@media (max-width: 768px) {
  .section-navigator-btn {
    padding: 0.75rem 1.5rem; /* Was 0.5rem 1rem */
    min-height: 44px;
  }

  .section-navigator-label {
    font-size: 0.9rem; /* Was 0.85rem */
  }
}
```

---

### 11. Add Active/Pressed States for Touch Feedback

**Problem:** Mobile users don't have hover states. Currently buttons rely on `:hover` for visual feedback. Need `:active` states for immediate tap feedback.

**Files to modify:**

- `frontend/src/App.css`
- `frontend/src/components/ActionButtons/ActionButtons.css`
- `frontend/src/components/sections/Projects/Projects.css`
- `frontend/src/pages/Projects/ProjectsPage.css`

**Changes:**

```css
/* In App.css, ADD after existing hover rules */
.section-nav-button:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.portfolio-link:active {
  transform: scale(0.98);
  box-shadow: none;
}

/* In ActionButtons.css, ADD */
.action-buttons .generate-btn:active:not(:disabled) {
  transform: scale(0.97);
  opacity: 0.85;
}

.action-buttons .reset-btn:active:not(:disabled) {
  transform: scale(0.97);
  opacity: 0.85;
}

/* In Projects.css, ADD */
.project-card:active {
  transform: scale(0.98);
}

/* In ProjectsPage.css, ADD */
.project-list-card:active {
  transform: scale(0.98);
  box-shadow: none;
}

.category-button:active {
  transform: scale(0.95);
}
```

---

## P1 - High: Projects Page Mobile Optimization

### 12. Optimize the Projects Listing Page for Mobile

**Problem:** The `/projects` page has large header margins, filter buttons may wrap awkwardly, and project cards don't fully utilize narrow screens.

**Files to modify:**

- `frontend/src/pages/Projects/ProjectsPage.css` (lines 1-56, 247-256)

**Changes:**

```css
/* In ProjectsPage.css, ADD/MODIFY */
@media (max-width: 768px) {
  .projects-header {
    margin-bottom: 1.5rem; /* Was 3rem */
  }

  .projects-title {
    font-size: 1.75rem; /* Was 2.5rem */
  }

  .projects-subtitle {
    font-size: 1rem; /* Was 1.125rem */
  }
}

@media (max-width: 640px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1rem; /* Was 1.5rem */
  }

  .projects-title {
    font-size: 1.5rem; /* Override existing 2rem */
  }

  .search-input {
    padding: 0.6rem 0.75rem; /* Slightly more compact */
    font-size: 16px; /* IMPORTANT: prevents iOS zoom on focus */
  }

  .category-filters {
    gap: 0.375rem; /* Tighter gaps between filter buttons */
  }

  .category-button {
    padding: 0.4rem 0.75rem; /* Slightly more compact */
    font-size: 0.8rem; /* Slightly smaller */
  }
}

@media (max-width: 480px) {
  .project-list-card {
    padding: 1rem; /* Was 1.5rem */
    gap: 0.75rem; /* Was 1rem */
  }

  .card-icon {
    font-size: 1.5rem; /* Was 2rem */
  }
}
```

---

### 13. Optimize the Project Detail Page for Mobile

**Problem:** The project detail header has a 4rem icon + content side by side. At 640px it switches to stacked, but could use further optimization.

**Files to modify:**

- `frontend/src/pages/Projects/ProjectDetailPage.css` (lines 207-220)

**Changes:**

```css
/* In ProjectDetailPage.css, EXPAND the 640px media query */
@media (max-width: 640px) {
  .project-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem; /* Was 2rem */
    margin: 1rem 0; /* Was 2rem 0 */
    padding-bottom: 1rem; /* Was 2rem */
  }

  .project-icon-large {
    font-size: 2.5rem; /* Was 4rem */
  }

  .project-title {
    font-size: 1.5rem;
  }

  .project-description {
    font-size: 1rem; /* Was 1.125rem */
  }

  .project-links {
    justify-content: center;
    flex-wrap: wrap;
  }

  .project-link {
    padding: 0.625rem 1.25rem; /* Was 0.75rem 1.5rem */
    font-size: 0.9rem;
    width: 100%; /* Full-width buttons on mobile */
    text-align: center;
    justify-content: center;
  }

  .project-footer {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    margin-top: 2rem; /* Was 3rem */
    padding-top: 1rem; /* Was 2rem */
  }

  .back-button {
    width: 100%;
  }

  /* Readme content */
  .readme-content {
    padding: 1rem; /* Was 1.5rem 2rem */
  }

  .readme-content h1 {
    font-size: 1.25rem; /* Was 1.5rem */
  }

  .readme-content h2 {
    font-size: 1.1rem; /* Was 1.25rem */
  }

  /* Technologies */
  .technologies-list {
    gap: 0.5rem; /* Was 0.75rem */
  }

  .technology-badge {
    padding: 0.375rem 0.75rem; /* Was 0.5rem 1rem */
    font-size: 0.85rem; /* Was 0.9375rem */
  }
}
```

---

## P1 - High: Layout & Spacing Consistency

### 14. Optimize the Non-Home Page Layout for Mobile

**Problem:** `.layout-main` has `padding: 2rem` which becomes `1rem` at 768px. This is combined with inner page padding creating excessive whitespace.

**Files to modify:**

- `frontend/src/components/layout/Layout/Layout.css` (lines 29-37)

**Changes:**

```css
/* In Layout.css, EXPAND the 768px media query */
@media (max-width: 768px) {
  .layout-main {
    padding: 1rem;
  }

  .compact-header {
    padding: 0.75rem 1rem; /* Was 1rem */
  }
}

@media (max-width: 480px) {
  .layout-main {
    padding: 0.75rem; /* Was still 1rem */
  }

  .compact-header {
    padding: 0.5rem 0.75rem;
  }
}
```

---

### 15. Fix the Footer on Mobile

**Problem:** Footer is reasonable but the social links area could be more touch-friendly.

**Files to modify:**

- `frontend/src/components/layout/Footer/Footer.css` (lines 40-45)

**Changes:**

```css
/* In Footer.css, MODIFY the 640px media query */
@media (max-width: 640px) {
  .footer {
    padding: 1.5rem 1rem; /* Was 2rem */
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem; /* Was 1rem */
  }

  .footer-links {
    gap: 2rem; /* Increase for touch targets */
  }

  .footer-links a {
    font-size: 0.9rem; /* Was 0.875rem */
    padding: 0.5rem 0; /* Add vertical padding for touch area */
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
}
```

---

### 16. Optimize the Contact CTA Section

**Problem:** The contact CTA social links row can overflow or become cramped on small screens.

**Files to modify:**

- `frontend/src/components/sections/ContactCTA/ContactCTA.css` (lines 77-92)

**Changes:**

```css
/* In ContactCTA.css, ADD to 768px media query */
@media (max-width: 768px) {
  .contact-cta {
    padding: 2rem 1rem;
  }

  .contact-cta-heading {
    font-size: 1.25rem; /* Was 1.5rem */
  }

  .contact-cta-links {
    flex-direction: column;
    align-items: stretch; /* Full-width buttons */
  }

  .contact-cta-btn {
    width: 100%;
    max-width: none; /* Was 280px */
    text-align: center;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .contact-cta-social {
    flex-wrap: wrap;
    gap: 1rem; /* Was 1.5rem */
    justify-content: center;
  }

  .contact-cta-social a {
    padding: 0.5rem 0; /* Touch target padding */
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
}
```

---

## P2 - Medium: Performance & UX Enhancements

### 17. Prevent iOS Input Zoom

**Problem:** When font-size is less than 16px on form inputs, iOS Safari auto-zooms the page. The search input on ProjectsPage uses `font-size: 1rem` (16px) which is fine, but ensure it stays at 16px on mobile.

**Files to modify:**

- `frontend/src/pages/Projects/ProjectsPage.css`

**Changes:**

```css
/* In ProjectsPage.css, ADD */
@media (max-width: 768px) {
  .search-input {
    font-size: 16px; /* Prevents iOS zoom */
  }
}
```

---

### 18. Add Safe Area Insets for Notched Phones

**Problem:** iPhones with notches (iPhone X+) may clip content at the bottom or edges.

**Files to modify:**

- `frontend/src/index.css` (base layer)
- `frontend/src/components/layout/MobileMenu/MobileMenu.css`

**Changes:**

```css
/* In index.css, ADD to the body styles */
@layer base {
  body {
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
      env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
}

/* In MobileMenu.css, MODIFY .mobile-menu */
.mobile-menu {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Also add the viewport meta tag if not present. Check `frontend/index.html`:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

---

### 19. Optimize the Contribution Graph for Mobile

**Problem:** The contribution graph is horizontally scrollable (`overflow-x: auto`) but the individual day squares (12x12px) are small for touch interaction. The graph also has a large minimum width since it shows 52 weeks.

**Files to modify:**

- `frontend/src/components/features/ContributionGraph/ContributionGraph.css`

**Changes:**

```css
/* In ContributionGraph.css, ADD */
@media (max-width: 768px) {
  .graph-day {
    width: 10px; /* Was 12px */
    height: 10px; /* Was 12px */
  }

  .graph-week {
    gap: 1px; /* Was 2px */
  }

  .graph-grid {
    gap: 1px; /* Was 2px */
  }

  .contribution-graph {
    padding: 0.75rem; /* Was 1rem */
  }

  /* Improve scroll hint */
  .graph-container {
    -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
    mask-image: linear-gradient(to right, black 90%, transparent 100%);
  }
}
```

---

### 20. Optimize the Repo Stats Grid for Mobile

**Problem:** At 640px, `.stats-grid` goes from 4 columns to 2. This is fine, but the text could be more compact.

**Files to modify:**

- `frontend/src/components/features/RepoStats/RepoStats.css` (lines 110-114)

**Changes:**

```css
/* In RepoStats.css, ADD */
@media (max-width: 480px) {
  .stat-value {
    font-size: 1rem; /* Was 1.125rem */
  }

  .stat-label {
    font-size: 0.7rem; /* Was 0.75rem */
  }

  .repo-meta {
    gap: 0.5rem;
    font-size: 0.8rem; /* Was 0.875rem */
  }
}
```

---

### 21. Add `loading="lazy"` to Non-Critical Images

**Problem:** Profile photos are loaded eagerly (which is correct for above-the-fold), but any images in project cards or READMEs should be lazy-loaded.

**Files to modify:**

- `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx` - check that rendered `<img>` tags have `loading="lazy"`

**Changes:**

In `GitHubReadme.tsx`, when rendering markdown images, add the `loading="lazy"` attribute:

```tsx
// In the markdown rendering config, ensure images use lazy loading:
img: ({ src, alt }) => (
  <img
    src={src}
    alt={alt || ""}
    className="readme-image"
    loading="lazy"
    decoding="async"
  />
);
```

---

### 22. Optimize the Action Buttons for Mobile

**Problem:** "SUMMON NEW LORE" and "DISPEL ENCHANTMENT" are uppercase, long text that may appear cramped in full-width stacked buttons.

**Files to modify:**

- `frontend/src/components/ActionButtons/ActionButtons.css` (lines 61-69)
- `frontend/src/components/ActionButtons/ActionButtons.tsx` (lines 25-26)

**Changes:**

```css
/* In ActionButtons.css, ADD */
@media (max-width: 480px) {
  .action-buttons .generate-btn,
  .action-buttons .reset-btn {
    font-size: 0.875rem; /* Was 1rem */
    padding: 0.625rem 1rem; /* Was 0.75rem 1.5rem */
    letter-spacing: 0.25px; /* Was 0.5px */
  }
}
```

---

## P2 - Medium: Dark Mode Mobile Considerations

### 23. Verify Dark Mode Contrast on Mobile

**Problem:** Some dark mode colors may have insufficient contrast on mobile OLED screens where blacks are true black.

**Files to modify:**

- `frontend/src/App.css` (lines 13-22)

**Changes (verify and adjust as needed):**

```css
/* In App.css, verify these contrast ratios meet WCAG AA (4.5:1 for text) */
.dark {
  --text-color-secondary: #94a3b8; /* Currently this - check against #1e293b bg */
  /* Consider bumping to #a0aec0 if contrast is insufficient */
}
```

Use a contrast checker tool to verify:

- `--text-color` (#f1f5f9) on `--card-background` (#1e293b): Ratio ~13.5:1 - PASS
- `--text-color-secondary` (#94a3b8) on `--card-background` (#1e293b): Ratio ~5.2:1 - PASS
- `--text-color-secondary` (#94a3b8) on `--background-color` (#0f172a): Ratio ~6.5:1 - PASS

These pass, but verify that the timeline and other sections using `var(--text-secondary)` (without `-color` suffix) actually reference the correct variable. In Timeline.css lines 109, 121, 123, 128-130, the CSS uses `--text-secondary` and `--text-primary` which are NOT defined in the theme. These may be rendering with fallback/inherited values:

```css
/* In Timeline.css, REPLACE all instances of: */
var(--text-secondary)  /* -> */ var(--text-color-secondary)
var(--text-primary)    /* -> */ var(--text-color)
```

This is a bug that affects both desktop and mobile but may be more noticeable on mobile dark mode.

---

## P3 - Nice to Have: Polish & Enhancement

### 24. Add Swipe Gesture Support for Section Navigation

**Problem:** On mobile, users can only tap section nav buttons to change sections. Swipe gestures would feel more native.

**Files to modify:**

- `frontend/src/pages/Home/HomePage.tsx`

**Implementation approach:**

Use the existing Framer Motion library (already a dependency) for gesture detection:

```tsx
import { motion, useSwipeable } from "framer-motion";

// In HomePage, wrap the content section:
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (Math.abs(info.offset.x) > 50) {
      const direction = info.offset.x > 0 ? -1 : 1;
      const currentIndex = SECTION_ORDER.indexOf(activeSection);
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < SECTION_ORDER.length) {
        handleSectionChange(SECTION_ORDER[nextIndex]);
      }
    }
  }}
>
```

Alternative: Use a lightweight library like `react-swipeable` or implement a custom touch handler hook.

---

### 25. Add Pull-to-Refresh Visual Indicator

Low priority but would feel native on mobile. Can be done with CSS and a small state machine tracking touch start/move/end on the main content area.

---

### 26. Consider a Bottom Tab Bar Alternative

For repeat mobile visitors, a fixed bottom tab bar (like native apps) for About/Journey/Projects/Music could improve navigation significantly. This would replace or supplement the sticky top section nav.

**Implementation approach:**

```tsx
// New component: frontend/src/components/layout/BottomTabBar/BottomTabBar.tsx
// Only render on mobile (useIsMobile hook)
// Fixed position at bottom with safe-area-inset-bottom padding
// Four tab items matching SECTION_ORDER
```

```css
.bottom-tab-bar {
  display: none;
}

@media (max-width: 768px) {
  .bottom-tab-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card-background);
    border-top: 1px solid var(--border-color);
    padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
    z-index: 100;
    justify-content: space-around;
  }

  /* Add bottom padding to main content so it's not hidden behind tab bar */
  .home-page {
    padding-bottom: 4rem;
  }
}
```

---

## Implementation Order (Recommended)

### Phase 1 - Critical (Do First)

1. Item 1 (Header footprint) - biggest visual impact
2. Item 2 (Section nav touch targets)
3. Item 3 (Box shadow card removal)
4. Item 10 (Touch target sizes across all components)
5. Item 23 (CSS variable bug fix - `--text-secondary` vs `--text-color-secondary`)

### Phase 2 - High Impact

6. Item 4 (Content section padding)
7. Item 5 (Timeline optimization)
8. Item 6 (Project cards)
9. Item 7 (Spotify embed height)
10. Item 8 (Bio text sizing)
11. Item 11 (Active/pressed states)
12. Item 12-13 (Projects page optimization)

### Phase 3 - Polish

13. Item 9 (Skills word cloud)
14. Item 14-16 (Layout, footer, contact CTA)
15. Item 17-18 (iOS zoom, safe area insets)
16. Item 19-22 (Feature components, action buttons)

### Phase 4 - Enhancement (Optional)

17. Item 24 (Swipe gestures)
18. Item 25 (Pull to refresh)
19. Item 26 (Bottom tab bar)

---

## Testing Checklist

After each phase, verify on:

- [ ] iPhone SE (375px) - smallest mainstream phone
- [ ] iPhone 14/15 (390px) - most common iPhone
- [ ] iPhone 14 Pro Max (430px) - largest iPhone
- [ ] Samsung Galaxy S series (360-412px)
- [ ] iPad Mini (768px) - tablet breakpoint boundary
- [ ] Landscape orientation on all above
- [ ] Dark mode on all above
- [ ] Test with increased font size (accessibility settings)
- [ ] Test with reduced motion enabled
- [ ] Test the Lighthouse mobile audit (target 90+ performance)

### Key Metrics to Track

- **Largest Contentful Paint (LCP)**: Target < 2.5s on 3G
- **Cumulative Layout Shift (CLS)**: Target < 0.1
- **First Input Delay (FID)**: Target < 100ms
- **Touch target minimum**: 44x44px on all interactive elements

---

## Files Changed Summary

| File                                                                       | Changes                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `frontend/src/App.css`                                                     | Header, sections, skills, bio, section nav mobile rules |
| `frontend/src/pages/Home/HomePage.css`                                     | Home page padding, header, skeleton, hamburger          |
| `frontend/src/pages/Home/HomePage.tsx`                                     | Potentially horizontal header layout                    |
| `frontend/src/pages/Projects/ProjectsPage.css`                             | Grid, filters, cards, search input                      |
| `frontend/src/pages/Projects/ProjectDetailPage.css`                        | Header, links, footer, readme                           |
| `frontend/src/components/layout/Layout/Layout.css`                         | Main padding, compact header                            |
| `frontend/src/components/layout/Footer/Footer.css`                         | Padding, touch targets                                  |
| `frontend/src/components/layout/MobileMenu/MobileMenu.css`                 | Touch targets, safe area                                |
| `frontend/src/components/layout/Navigation/Navigation.css`                 | Hamburger sizing                                        |
| `frontend/src/components/ActionButtons/ActionButtons.css`                  | Mobile button sizing                                    |
| `frontend/src/components/common/SectionNavigator/SectionNavigator.css`     | Touch targets                                           |
| `frontend/src/components/sections/ContactCTA/ContactCTA.css`               | Full-width buttons, social links                        |
| `frontend/src/components/sections/Timeline/Timeline.css`                   | Mobile layout, compact cards, CSS var fix               |
| `frontend/src/components/sections/Projects/Projects.css`                   | Card image heights, padding                             |
| `frontend/src/components/sections/Music/Music.css`                         | Spotify embed height                                    |
| `frontend/src/components/features/ContributionGraph/ContributionGraph.css` | Smaller graph cells                                     |
| `frontend/src/components/features/RepoStats/RepoStats.css`                 | Compact stat text                                       |
| `frontend/src/components/features/GitHubReadme/GitHubReadme.css`           | (Already responsive)                                    |
| `frontend/src/components/Skills.tsx`                                       | Responsive font size range                              |
| `frontend/src/hooks/useIsMobile.ts`                                        | NEW: reusable mobile breakpoint hook                    |
| `frontend/src/index.css`                                                   | Safe area insets                                        |
| `frontend/index.html`                                                      | Viewport-fit: cover                                     |
