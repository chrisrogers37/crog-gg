# Phase 07: Mobile Navigation Overhaul

**Status:** 🔧 IN PROGRESS
**Started:** 2026-02-12
**PR Title:** Implement mobile navigation menu with hamburger toggle
**Risk Level:** Low
**Estimated Effort:** Medium (3-4 hours)

## Files Modified

| Action   | File                                                       |
| -------- | ---------------------------------------------------------- |
| Created  | `frontend/src/components/layout/MobileMenu/MobileMenu.tsx` |
| Created  | `frontend/src/components/layout/MobileMenu/MobileMenu.css` |
| Created  | `frontend/src/components/layout/MobileMenu/index.ts`       |
| Modified | `frontend/src/components/layout/Navigation/Navigation.tsx` |
| Modified | `frontend/src/components/layout/Navigation/Navigation.css` |
| Modified | `frontend/src/pages/Home/HomePage.tsx`                     |
| Modified | `frontend/src/pages/Home/HomePage.css`                     |
| Modified | `frontend/src/components/layout/Layout/Layout.tsx`         |

## Context

The mobile experience has two problems:

1. **Section navigation** is a cramped horizontal scroll of tabs (now 4 tabs after Phase 03, but still suboptimal on small screens)
2. **`isMobileMenuOpen` state exists** in the Zustand uiStore (line 18) with `toggleMobileMenu()` (line 118) and `closeMobileMenu()` (line 125) actions, but they're **never wired up to any UI**

50%+ of portfolio visitors are likely on mobile. A proper hamburger menu with full-screen overlay is standard UX that replaces the cramped scroll.

This phase is last because it needs to account for all new sections and components from earlier phases.

## Dependencies

- **Depends on:** All previous phases (needs final section structure)
- **Unlocks:** Nothing (this is the final phase)

## Detailed Implementation Plan

### Step 1: Create MobileMenu component

**File:** `frontend/src/components/layout/MobileMenu/MobileMenu.tsx` (NEW)

```tsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, useIsMobileMenuOpen } from "../../../store";
import { ThemeToggle } from "../../common/ThemeToggle";
import "./MobileMenu.css";

type MobileMenuProps = {
  sections?: { id: string; label: string }[];
  onSectionChange?: (section: string) => void;
  activeSection?: string;
};

export function MobileMenu({
  sections,
  onSectionChange,
  activeSection,
}: MobileMenuProps) {
  const isOpen = useIsMobileMenuOpen();
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMobileMenu();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeMobileMenu]);

  const handleSectionClick = (sectionId: string) => {
    onSectionChange?.(sectionId);
    closeMobileMenu();
  };

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
          />

          {/* Menu panel */}
          <motion.nav
            className="mobile-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            aria-label="Mobile navigation"
          >
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">menu</span>
              <button
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                &#10005;
              </button>
            </div>

            <div className="mobile-menu-content">
              {/* Page links */}
              <div className="mobile-menu-section">
                <Link
                  to="/"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  home
                </Link>
                <Link
                  to="/projects"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  all projects
                </Link>
              </div>

              {/* Section links (only on homepage) */}
              {sections && sections.length > 0 && (
                <div className="mobile-menu-section">
                  <span className="mobile-menu-section-label">sections</span>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      className={`mobile-menu-section-btn ${
                        activeSection === section.id ? "active" : ""
                      }`}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      {section.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="mobile-menu-section">
                <span className="mobile-menu-section-label">connect</span>
                <a
                  href="https://github.com/chrisrogers37"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  github
                </a>
                <a
                  href="https://linkedin.com/in/chrisrogers37"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  linkedin
                </a>
                <a
                  href="https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  spotify
                </a>
              </div>

              {/* Theme toggle */}
              <div className="mobile-menu-section mobile-menu-theme">
                <span className="mobile-menu-section-label">theme</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Step 2: Create MobileMenu styles

**File:** `frontend/src/components/layout/MobileMenu/MobileMenu.css` (NEW)

```css
/* Backdrop */
.mobile-menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* Menu Panel */
.mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: var(--card-background);
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.mobile-menu-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.mobile-menu-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;
  line-height: 1;
}

.mobile-menu-close:hover {
  color: var(--text-primary);
}

/* Content */
.mobile-menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.mobile-menu-section {
  padding: 0.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-menu-section + .mobile-menu-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.mobile-menu-section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: lowercase;
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
}

/* Links and buttons */
.mobile-menu-link,
.mobile-menu-section-btn {
  display: block;
  padding: 0.6rem 0;
  font-size: 1rem;
  color: var(--text-primary);
  text-decoration: none;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  width: 100%;
  transition: color 0.2s;
}

.mobile-menu-link:hover,
.mobile-menu-section-btn:hover {
  color: var(--primary-color);
}

.mobile-menu-section-btn.active {
  color: var(--primary-color);
  font-weight: 600;
}

/* Theme section */
.mobile-menu-theme {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
```

### Step 3: Create barrel export

**File:** `frontend/src/components/layout/MobileMenu/index.ts` (NEW)

```typescript
export { MobileMenu } from "./MobileMenu";
```

### Step 4: Add hamburger button to Navigation

**File:** `frontend/src/components/layout/Navigation/Navigation.tsx`

**Before (entire file):**

```tsx
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../../common/ThemeToggle";
import "./Navigation.css";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/projects", label: "Projects" },
  ];

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        Chris Rogers
      </Link>

      <div className="nav-right">
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "active"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </div>
    </nav>
  );
}
```

**After:**

```tsx
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "../../common/ThemeToggle";
import { useUIStore } from "../../../store";
import "./Navigation.css";

export function Navigation() {
  const location = useLocation();
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/projects", label: "Projects" },
  ];

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo">
        Chris Rogers
      </Link>

      <div className="nav-right">
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "active"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ThemeToggle />

        {/* Hamburger button - visible on mobile only */}
        <button
          className="nav-hamburger"
          onClick={toggleMobileMenu}
          aria-label="Open menu"
        >
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
        </button>
      </div>
    </nav>
  );
}
```

### Step 5: Add hamburger styles to Navigation.css

**File:** `frontend/src/components/layout/Navigation/Navigation.css`

**Add** the following at the end of the file:

```css
/* Hamburger button - hidden on desktop */
.nav-hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: 0.5rem;
}

.nav-hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: transform 0.2s;
}

@media (max-width: 768px) {
  .nav-hamburger {
    display: flex;
  }

  .nav-links {
    display: none;
  }
}
```

### Step 6: Add hamburger to HomePage header

The homepage doesn't use the Navigation component - it has its own header. Add a hamburger button there too.

**File:** `frontend/src/pages/Home/HomePage.tsx`

**Add import** (with other imports):

```tsx
import { MobileMenu } from "../../components/layout/MobileMenu";
```

**Add mobile menu state** (in the component body, after other store calls):

```tsx
const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
```

**Add hamburger button** to the `.home-theme-toggle` div (line 200-202):

**Before:**

```tsx
<div className="home-theme-toggle">
  <ThemeToggle />
</div>
```

**After:**

```tsx
<div className="home-theme-toggle">
  <ThemeToggle />
  <button
    className="home-hamburger"
    onClick={toggleMobileMenu}
    aria-label="Open menu"
  >
    <span className="home-hamburger-line" />
    <span className="home-hamburger-line" />
    <span className="home-hamburger-line" />
  </button>
</div>
```

**Add MobileMenu** at the bottom of the component return, just before the closing `</>` (after the closing `</div>` of `.home-page`):

```tsx
{
  /* Mobile Menu */
}
<MobileMenu
  sections={[
    { id: "about", label: "About" },
    { id: "journey", label: "Journey" },
    { id: "projects", label: "Projects" },
    { id: "music", label: "Music" },
  ]}
  onSectionChange={handleSectionChange}
  activeSection={activeSection}
/>;
```

**Add hamburger styles** to `frontend/src/pages/Home/HomePage.css`:

```css
/* Hamburger for homepage - hidden on desktop */
.home-hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.home-hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
}

@media (max-width: 768px) {
  .home-hamburger {
    display: flex;
  }

  .home-theme-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
```

### Step 7: Add MobileMenu to Layout for non-home pages

**File:** `frontend/src/components/layout/Layout/Layout.tsx`

**Before:**

```tsx
import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import "./Layout.css";

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="layout">
      {!isHomePage && (
        <header className="compact-header">
          <Navigation />
        </header>
      )}

      <main className={`layout-main ${isHomePage ? "home-layout" : ""}`}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
```

**After:**

```tsx
import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "../Navigation";
import { Footer } from "../Footer";
import { MobileMenu } from "../MobileMenu";
import "./Layout.css";

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="layout">
      {!isHomePage && (
        <header className="compact-header">
          <Navigation />
        </header>
      )}

      <main className={`layout-main ${isHomePage ? "home-layout" : ""}`}>
        <Outlet />
      </main>

      <Footer />

      {/* Mobile menu for non-home pages */}
      {!isHomePage && <MobileMenu />}
    </div>
  );
}
```

## Test Plan

### Unit Test

Create `frontend/src/components/layout/MobileMenu/__tests__/MobileMenu.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MobileMenu } from "../MobileMenu";

// Mock the store
vi.mock("../../../../store", () => ({
  useUIStore: (selector: Function) => {
    const state = {
      isMobileMenuOpen: true,
      closeMobileMenu: vi.fn(),
    };
    return selector(state);
  },
  useIsMobileMenuOpen: () => true,
}));

describe("MobileMenu", () => {
  const sections = [
    { id: "about", label: "About" },
    { id: "journey", label: "Journey" },
  ];

  it("renders menu when open", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} activeSection="about" />
      </MemoryRouter>
    );
    expect(screen.getByText("menu")).toBeInTheDocument();
    expect(screen.getByText("about")).toBeInTheDocument();
    expect(screen.getByText("journey")).toBeInTheDocument();
  });

  it("renders social links", () => {
    render(
      <MemoryRouter>
        <MobileMenu sections={sections} />
      </MemoryRouter>
    );
    expect(screen.getByText("github")).toBeInTheDocument();
    expect(screen.getByText("linkedin")).toBeInTheDocument();
  });
});
```

### E2E Test

Add to `frontend/e2e/navigation.spec.ts`:

```typescript
test("mobile menu opens and closes", async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // Find and click hamburger
  const hamburger = page.locator(".home-hamburger");
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  // Menu should be visible
  const menu = page.locator(".mobile-menu");
  await expect(menu).toBeVisible({ timeout: 3000 });

  // Close button should work
  const closeBtn = page.locator(".mobile-menu-close");
  await closeBtn.click();
  await expect(menu).not.toBeVisible();
});

test("mobile menu section navigation works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // Open menu
  await page.locator(".home-hamburger").click();

  // Click a section
  const journeyBtn = page.locator(".mobile-menu-section-btn", {
    hasText: "journey",
  });
  await journeyBtn.click();

  // Menu should close
  await expect(page.locator(".mobile-menu")).not.toBeVisible();

  // Timeline should be visible
  const timeline = page.locator(".timeline-container");
  await expect(timeline).toBeVisible({ timeout: 5000 });
});
```

## Documentation Updates

- New component: `frontend/src/components/layout/MobileMenu/`
- `isMobileMenuOpen` state is now wired up (previously unused)
- Hamburger button visible below 768px on all pages

## Edge Cases

1. **Menu open during viewport resize:** Body scroll lock is tied to `isOpen` state, cleaned up on unmount
2. **Very small screens (320px):** Menu width is `max-width: 85vw`, so it adapts
3. **Escape key:** Closes menu via keyboard event listener
4. **Backdrop click:** Closes menu via onClick on backdrop overlay
5. **Route change:** Links call `closeMobileMenu()` before navigation
6. **Orientation change:** CSS handles it via viewport-relative units

## Verification Checklist

```bash
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm run test:run
cd frontend && npm run test:e2e
```

- [ ] Hamburger icon visible on mobile (below 768px)
- [ ] Hamburger hidden on desktop
- [ ] Menu slides in from right on open
- [ ] Menu has all sections (About, Journey, Projects, Music)
- [ ] Active section is highlighted in menu
- [ ] Clicking a section navigates and closes menu
- [ ] Body scroll is locked when menu is open
- [ ] Escape key closes menu
- [ ] Backdrop click closes menu
- [ ] Social links render (GitHub, LinkedIn, Spotify)
- [ ] Theme toggle is accessible in the menu
- [ ] Desktop navigation still works unchanged
- [ ] Works on both homepage and project pages
- [ ] Dark mode rendering correct

## What NOT To Do

- **Don't break desktop navigation** - hamburger is `display: none` above 768px
- **Don't remove the section tab bar on desktop** - mobile menu is an addition, not a replacement
- **Don't use a heavy library** - Framer Motion (already a dependency) handles the slide animation
- **Don't forget body scroll lock** - without it, the page scrolls behind the overlay
- **Don't hard-code section names** - pass them as props so the menu adapts to section changes
