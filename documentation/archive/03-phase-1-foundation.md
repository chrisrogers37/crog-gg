# 03 - Phase 1: Foundation

## Overview

**Goal**: Establish the foundation for a multi-page application by adding React Router, fixing critical type issues, and extracting the first components.

**Estimated Effort**: 13 story points

**Prerequisites**:

- Read [01-current-state-analysis.md](./01-current-state-analysis.md)
- Read [02-architecture-roadmap.md](./02-architecture-roadmap.md)
- Local development environment running

**Deliverables**:

1. React Router installed and configured
2. HomePage component created (refactored from App.tsx)
3. `any` types replaced with proper interfaces
4. ActionButtons component extracted
5. All existing functionality preserved

---

## Table of Contents

1. [Task 1.1: Install React Router](#task-11-install-react-router)
2. [Task 1.2: Create Router Configuration](#task-12-create-router-configuration)
3. [Task 1.3: Create ContentState Interface](#task-13-create-contentstate-interface)
4. [Task 1.4: Create HomePage Component](#task-14-create-homepage-component)
5. [Task 1.5: Extract ActionButtons Component](#task-15-extract-actionbuttons-component)
6. [Task 1.6: Update App.tsx to Use Router](#task-16-update-apptsx-to-use-router)
7. [Task 1.7: Add NotFoundPage](#task-17-add-notfoundpage)
8. [Verification Checklist](#verification-checklist)
9. [Common Issues](#common-issues)

---

## Task 1.1: Install React Router

### What We're Doing

Installing React Router v6 to enable multi-page navigation.

### Steps

1. **Install the package**:

   ```bash
   cd frontend
   npm install react-router-dom
   ```

2. **Install types** (included in package, but verify):

   ```bash
   npm install @types/react-router-dom --save-dev
   ```

3. **Verify installation** in `package.json`:
   ```json
   {
     "dependencies": {
       "react-router-dom": "^6.22.0"
     }
   }
   ```

### Why React Router v6

- Data APIs (loaders, actions) for future use
- Nested routes for layout composition
- Better TypeScript support than v5
- Smaller bundle than alternatives

---

## Task 1.2: Create Router Configuration

### What We're Doing

Creating a centralized router configuration file.

### Create New File: `frontend/src/router.tsx`

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home/HomePage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

// Router configuration
// Add new routes here as the application grows
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

// Router provider component for use in main.tsx
export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Create Directory Structure

```bash
mkdir -p frontend/src/pages/Home
mkdir -p frontend/src/pages/NotFound
```

### Why This Structure

- Separates routing concerns from components
- Easy to add new routes
- `errorElement` handles route-level errors
- Wildcard route catches 404s

---

## Task 1.3: Create ContentState Interface

### What We're Doing

Replacing the `any` type on `currentContent` with a proper TypeScript interface.

### Current Problem

**Location**: `frontend/src/App.tsx:29`

```typescript
const [currentContent, setCurrentContent] = useState<any>(null); // BAD: 'any' type
```

### Create New File: `frontend/src/types/content.ts`

```typescript
/**
 * ContentState represents the complete state of all content in the application.
 * This replaces the 'any' type previously used in App.tsx.
 */

import { BioData } from "./Bio";
import { ExperienceItem } from "./Experience";
import { EducationItem } from "./Education";
import { SkillItem } from "./Skills";
import { Project } from "./Project";

/**
 * The complete content state loaded from YAML files.
 * This interface should match the shape returned by loadResumeData().
 */
export interface ContentState {
  bio: BioData;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: Project[];
}

/**
 * Content state that may be partially loaded.
 * Used during initial loading when some content may not be available yet.
 */
export interface PartialContentState {
  bio?: BioData | null;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: SkillItem[];
  projects?: Project[];
}

/**
 * Props for components that receive content state.
 */
export interface ContentProps {
  content: ContentState;
  isRegenerating?: boolean;
  onRegenerate?: (section: string, useFantasy: boolean) => void;
  onReset?: () => void;
}
```

### Update Type Index File: `frontend/src/types/index.ts`

Create this file to enable cleaner imports:

```typescript
// Barrel export for all types
export type { BioData } from "./Bio";
export type { ExperienceItem } from "./Experience";
export type { EducationItem } from "./Education";
export type { SkillItem } from "./Skills";
export type { Project } from "./Project";
export type {
  ContentState,
  PartialContentState,
  ContentProps,
} from "./content";
```

### Update Usage in Components

After creating these types, update App.tsx (this will be done in Task 1.4):

```typescript
// Before
const [currentContent, setCurrentContent] = useState<any>(null);

// After
import { ContentState } from "./types";
const [currentContent, setCurrentContent] = useState<ContentState | null>(null);
```

---

## Task 1.4: Create HomePage Component

### What We're Doing

Extracting the main page content from App.tsx into a dedicated HomePage component.

### Current State of App.tsx

The current `App.tsx` has 354 lines and handles:

- State management (lines 29-34)
- Data loading (lines 37-53)
- Content regeneration (lines 78-141)
- Content reset (lines 143-162)
- Event handling (lines 55-75)
- All rendering (lines 165-354)

### Create New File: `frontend/src/pages/Home/HomePage.tsx`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';

// Components
import { About } from '../../components/About';
import { Portfolio } from '../../components/Portfolio';
import { Skills } from '../../components/Skills';
import { SectionNav } from '../../components/SectionNav';
import { Typewriter } from '../../components/Typewriter';
import { ActionButtons } from '../../components/ActionButtons';

// Types
import { ContentState } from '../../types';

// Data loading
import { loadResumeData } from '../../data/resume';

// Styles
import '../../App.css';
import '../../styles/transitions.css';

/**
 * HomePage - Main portfolio landing page
 *
 * This component was extracted from the original App.tsx.
 * It handles:
 * - Loading content from YAML files
 * - Managing active section state
 * - Content regeneration via API
 * - Content reset functionality
 */
export function HomePage() {
  // ===========================================
  // STATE
  // ===========================================

  const [currentContent, setCurrentContent] = useState<ContentState | null>(null);
  const [originalContent, setOriginalContent] = useState<ContentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasModifiedContent, setHasModifiedContent] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  // Refs for scroll behavior
  const isFirstRender = useRef(true);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // ===========================================
  // DATA LOADING
  // ===========================================

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const data = await loadResumeData();
        setCurrentContent(data);
        setOriginalContent(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load content:', err);
        setError('Failed to load content. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  // ===========================================
  // EVENT HANDLERS
  // ===========================================

  /**
   * Handle content regeneration via OpenAI API
   */
  const handleRegenerate = useCallback(async (useFantasy: boolean = false) => {
    if (!currentContent || !activeSection) return;

    try {
      setIsRegenerating(true);

      const API_URL = import.meta.env.VITE_API_URL || 'https://api.crog.gg';

      const response = await fetch(`${API_URL}/api/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          section: activeSection,
          current_content: currentContent,
          use_fantasy: useFantasy,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Update content based on which section was regenerated
      setCurrentContent((prev) => {
        if (!prev) return prev;

        if (activeSection === 'about') {
          return {
            ...prev,
            bio: { ...prev.bio, about_text: data.about_text },
          };
        }

        if (activeSection === 'experience' || activeSection === 'portfolio') {
          return {
            ...prev,
            experience: data.experience || prev.experience,
            education: data.education || prev.education,
          };
        }

        return prev;
      });

      setHasModifiedContent(true);

      // Dispatch event for components that need to react
      window.dispatchEvent(
        new CustomEvent('contentRegenerated', {
          detail: { section: activeSection, content: data },
        })
      );
    } catch (err) {
      console.error('Regeneration failed:', err);
      setError('Failed to regenerate content. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  }, [currentContent, activeSection]);

  /**
   * Reset content to original YAML values
   */
  const handleReset = useCallback(() => {
    if (originalContent) {
      setCurrentContent(originalContent);
      setHasModifiedContent(false);

      window.dispatchEvent(
        new CustomEvent('contentRegenerated', {
          detail: { section: 'all', content: originalContent },
        })
      );
    }
  }, [originalContent]);

  /**
   * Handle section navigation
   */
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection((prev) => (prev === section ? '' : section));

    // Scroll to content on subsequent interactions (not first render)
    if (!isFirstRender.current && mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    isFirstRender.current = false;
  }, []);

  // ===========================================
  // RENDER HELPERS
  // ===========================================

  /**
   * Determine which content section to show based on activeSection
   */
  const renderActiveSection = () => {
    if (!currentContent) return null;

    switch (activeSection) {
      case 'about':
        return (
          <About
            initialText={currentContent.bio.about_text}
            isRegenerating={isRegenerating}
          />
        );
      case 'skills':
        return <Skills skills={currentContent.skills} />;
      case 'experience':
      case 'education':
      case 'projects':
      case 'music':
        return (
          <Portfolio
            experience={currentContent.experience}
            education={currentContent.education}
            activeTab={activeSection}
            isRegenerating={isRegenerating}
          />
        );
      default:
        return null;
    }
  };

  // ===========================================
  // RENDER
  // ===========================================

  // Loading state
  if (isLoading) {
    return (
      <div className="app loading-state">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app error-state">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // No content state
  if (!currentContent) {
    return (
      <div className="app error-state">
        <p>No content available.</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="profile-section">
          <img
            src="/headshot.png"
            alt={`${currentContent.bio.display_name} headshot`}
            className="profile-photo"
          />
          <div className="profile-info">
            <h1 className="name">{currentContent.bio.display_name}</h1>
            <p className="location">📍 {currentContent.bio.location}</p>
            <p className="email">📧 {currentContent.bio.email}</p>

            {/* Social Links */}
            <div className="social-links">
              {currentContent.bio.social_links.github && (
                <a
                  href={currentContent.bio.social_links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}
              {currentContent.bio.social_links.linkedin && (
                <a
                  href={currentContent.bio.social_links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              )}
              {currentContent.bio.social_links.spotify && (
                <a
                  href={currentContent.bio.social_links.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Message with Typewriter Effect */}
        <div className="welcome-message">
          <Typewriter
            text={currentContent.bio.welcome_message}
            speed={30}
            delay={500}
          />
        </div>
      </header>

      {/* Section Navigation */}
      <SectionNav
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Content */}
      <main ref={mainContentRef} className="main-content">
        <CSSTransition
          in={!!activeSection}
          timeout={300}
          classNames="section"
          unmountOnExit
        >
          <div className="section-container">
            {renderActiveSection()}
          </div>
        </CSSTransition>
      </main>

      {/* Action Buttons */}
      {activeSection && (
        <ActionButtons
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          isRegenerating={isRegenerating}
          hasModifiedContent={hasModifiedContent}
          activeSection={activeSection}
        />
      )}
    </div>
  );
}
```

### Create Index File: `frontend/src/pages/Home/index.ts`

```typescript
export { HomePage } from "./HomePage";
```

---

## Task 1.5: Extract ActionButtons Component

### What We're Doing

Extracting the duplicated action button JSX into a reusable component.

### Current Problem

**Location**: `frontend/src/App.tsx:277-344`

The same button pattern appears 3 times with minor variations:

- Lines 277-294 (when about is active)
- Lines 304-321 (when portfolio sections are active)
- Lines 327-344 (when skills is active)

### Create New File: `frontend/src/components/ActionButtons/ActionButtons.tsx`

```typescript
import './ActionButtons.css';

interface ActionButtonsProps {
  /**
   * Handler for content regeneration.
   * @param useFantasy - Whether to use fantasy/LOTR style regeneration
   */
  onRegenerate: (useFantasy: boolean) => void;

  /**
   * Handler for resetting content to original state.
   */
  onReset: () => void;

  /**
   * Whether regeneration is currently in progress.
   */
  isRegenerating: boolean;

  /**
   * Whether the content has been modified from its original state.
   */
  hasModifiedContent: boolean;

  /**
   * The currently active section (determines which buttons to show).
   */
  activeSection: string;
}

/**
 * ActionButtons - Controls for content regeneration and reset
 *
 * This component renders the "SUMMON NEW LORE" and "DISPEL ENCHANTMENT"
 * buttons that allow users to regenerate content via AI or reset to original.
 *
 * @example
 * <ActionButtons
 *   onRegenerate={(useFantasy) => handleRegenerate(useFantasy)}
 *   onReset={handleReset}
 *   isRegenerating={false}
 *   hasModifiedContent={true}
 *   activeSection="about"
 * />
 */
export function ActionButtons({
  onRegenerate,
  onReset,
  isRegenerating,
  hasModifiedContent,
  activeSection,
}: ActionButtonsProps) {
  // Sections that support regeneration
  const regeneratableSections = ['about', 'experience', 'education', 'portfolio'];
  const canRegenerate = regeneratableSections.includes(activeSection);

  // Skills section doesn't support regeneration
  if (activeSection === 'skills') {
    return null;
  }

  return (
    <div className="action-buttons">
      {/* Regenerate Button */}
      {canRegenerate && (
        <div className="regenerate-buttons">
          <button
            className="regenerate-button primary"
            onClick={() => onRegenerate(false)}
            disabled={isRegenerating}
            aria-busy={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Summoning...
              </>
            ) : (
              '✨ SUMMON NEW LORE'
            )}
          </button>

          <button
            className="regenerate-button fantasy"
            onClick={() => onRegenerate(true)}
            disabled={isRegenerating}
            aria-busy={isRegenerating}
            title="Regenerate content in Lord of the Rings / fantasy style"
          >
            {isRegenerating ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Enchanting...
              </>
            ) : (
              '🧙 SUMMON FANTASY LORE'
            )}
          </button>
        </div>
      )}

      {/* Reset Button */}
      {hasModifiedContent && (
        <button
          className="reset-button"
          onClick={onReset}
          disabled={isRegenerating}
        >
          🔮 DISPEL ENCHANTMENT
        </button>
      )}
    </div>
  );
}
```

### Create CSS File: `frontend/src/components/ActionButtons/ActionButtons.css`

```css
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  margin-top: 2rem;
}

.regenerate-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.regenerate-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.regenerate-button.primary {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: white;
}

.regenerate-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.regenerate-button.fantasy {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: white;
}

.regenerate-button.fantasy:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.regenerate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .regenerate-buttons {
    flex-direction: column;
    width: 100%;
  }

  .regenerate-button {
    width: 100%;
    justify-content: center;
  }
}
```

### Create Index File: `frontend/src/components/ActionButtons/index.ts`

```typescript
export { ActionButtons } from "./ActionButtons";
```

---

## Task 1.6: Update App.tsx to Use Router

### What We're Doing

Converting the original App.tsx to a minimal shell that renders the router.

### Update `frontend/src/App.tsx`

```typescript
/**
 * App.tsx - Application Shell
 *
 * This file has been simplified to serve as the application shell.
 * All page-specific logic has been moved to pages/Home/HomePage.tsx.
 *
 * The router configuration is in router.tsx.
 */
import { AppRouter } from './router';

function App() {
  return <AppRouter />;
}

export default App;
```

### Why This Change

- App.tsx becomes a thin wrapper
- All routing logic is centralized in router.tsx
- Page components handle their own state and rendering
- Easy to add new pages without touching App.tsx

---

## Task 1.7: Add NotFoundPage

### What We're Doing

Creating a 404 page for unknown routes.

### Create New File: `frontend/src/pages/NotFound/NotFoundPage.tsx`

```typescript
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

/**
 * NotFoundPage - 404 error page
 *
 * Displayed when users navigate to a route that doesn't exist.
 * Provides a link back to the home page.
 */
export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-message">
          Alas, this page has vanished into the void.
        </p>
        <p className="not-found-submessage">
          The path you seek does not exist in this realm.
        </p>
        <Link to="/" className="not-found-link">
          ← Return to the Homepage
        </Link>
      </div>
    </div>
  );
}
```

### Create CSS File: `frontend/src/pages/NotFound/NotFoundPage.css`

```css
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.not-found-title {
  font-size: 8rem;
  font-weight: 700;
  color: #2563eb;
  margin: 0;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(37, 99, 235, 0.2);
}

.not-found-message {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 1.5rem 0 0.5rem;
}

.not-found-submessage {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 2rem;
}

.not-found-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.not-found-link:hover {
  background: #1e40af;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
```

### Create Index File: `frontend/src/pages/NotFound/index.ts`

```typescript
export { NotFoundPage } from "./NotFoundPage";
```

---

## Verification Checklist

After completing all tasks, verify the following:

### Functionality Tests

- [ ] **Home page loads**: Navigate to `http://localhost:5173/` and verify the page loads
- [ ] **Content displays**: Bio, social links, and welcome message appear
- [ ] **Section navigation works**: Click each section tab and verify content shows
- [ ] **About section shows**: Click "About" and verify bio text displays
- [ ] **Skills section shows**: Click "Skills" and verify word cloud displays
- [ ] **Experience section shows**: Click "Experience" and verify job cards display
- [ ] **Education section shows**: Click "Education" and verify education cards display
- [ ] **Projects section shows**: Click "Projects" and verify projects display
- [ ] **Music section shows**: Click "Music" and verify Spotify embed displays
- [ ] **Regenerate works**: Click "SUMMON NEW LORE" and verify API call succeeds
- [ ] **Fantasy mode works**: Click "SUMMON FANTASY LORE" and verify API call succeeds
- [ ] **Reset works**: After regenerating, click "DISPEL ENCHANTMENT" and verify reset
- [ ] **404 page shows**: Navigate to `/nonexistent` and verify 404 page displays
- [ ] **404 link works**: Click "Return to Homepage" and verify navigation

### TypeScript Verification

```bash
cd frontend
npm run build
```

- [ ] **No TypeScript errors**: Build completes without type errors
- [ ] **No `any` types**: Search for `any` in new files - should find none

### Code Quality Checks

- [ ] **ESLint passes**: `npm run lint` shows no errors
- [ ] **No console warnings**: Browser console shows no React warnings
- [ ] **No duplicate code**: ActionButtons is used instead of inline buttons

### File Structure Verification

```
frontend/src/
├── components/
│   ├── ActionButtons/
│   │   ├── ActionButtons.tsx    ✓ NEW
│   │   ├── ActionButtons.css    ✓ NEW
│   │   └── index.ts             ✓ NEW
│   └── ... (existing)
├── pages/
│   ├── Home/
│   │   ├── HomePage.tsx         ✓ NEW
│   │   └── index.ts             ✓ NEW
│   └── NotFound/
│       ├── NotFoundPage.tsx     ✓ NEW
│       ├── NotFoundPage.css     ✓ NEW
│       └── index.ts             ✓ NEW
├── types/
│   ├── content.ts               ✓ NEW
│   ├── index.ts                 ✓ NEW
│   └── ... (existing)
├── router.tsx                   ✓ NEW
└── App.tsx                      ✓ MODIFIED (simplified)
```

---

## Common Issues

### Issue: "Cannot find module 'react-router-dom'"

**Cause**: Package not installed correctly.

**Solution**:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Property 'xxx' does not exist on type 'ContentState'"

**Cause**: Type mismatch between ContentState interface and actual data.

**Solution**: Check that `ContentState` in `types/content.ts` matches the shape returned by `loadResumeData()` in `data/resume.ts`.

### Issue: "useNavigate() may be used only in the context of a Router"

**Cause**: Trying to use router hooks outside of RouterProvider.

**Solution**: Ensure all components using router hooks are rendered inside `<RouterProvider>`.

### Issue: Styles not applying to new components

**Cause**: CSS file not imported.

**Solution**: Verify the CSS import at the top of the component file:

```typescript
import "./ActionButtons.css";
```

### Issue: 404 page shows on home route

**Cause**: Router configuration issue.

**Solution**: Check that the home route uses `index: true` or `path: '/'`:

```typescript
{
  path: '/',
  element: <HomePage />,
}
```

---

## Next Steps

After completing Phase 1:

1. **Commit your changes**:

   ```bash
   git add .
   git commit -m "Phase 1: Add React Router and extract initial components"
   ```

2. **Deploy and test in production** to ensure nothing broke

3. **Proceed to Phase 2**: [04-phase-2-modularity.md](./04-phase-2-modularity.md)

---

_Document Version: 1.0.0_
_Last Updated: January 2026_
