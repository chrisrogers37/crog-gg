# 01 - Current State Analysis

## Purpose
This document provides a comprehensive analysis of the existing codebase. **Read this document completely before making any changes.** Understanding the current patterns, technical debt, and design decisions will prevent introducing regressions.

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Current Patterns](#current-patterns)
6. [Technical Debt Inventory](#technical-debt-inventory)
7. [Critical Files Reference](#critical-files-reference)

---

## Project Structure

```
choose-your-own-chris/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # React components (5 files)
│   │   │   ├── About.tsx        # About section with fade transitions
│   │   │   ├── Portfolio.tsx    # Experience, Education, Projects, Music
│   │   │   ├── Skills.tsx       # Word cloud visualization
│   │   │   ├── SectionNav.tsx   # Sticky navigation tabs
│   │   │   └── Typewriter.tsx   # Character-by-character animation
│   │   ├── types/               # TypeScript interfaces
│   │   │   ├── Bio.ts           # BioData interface
│   │   │   ├── Education.ts     # EducationItem interface
│   │   │   ├── Experience.ts    # ExperienceItem interface
│   │   │   ├── Project.ts       # Project interface
│   │   │   └── Skills.ts        # SkillItem interface
│   │   ├── utils/               # Data loading utilities
│   │   │   ├── bioLoader.ts     # Loads bio.yaml
│   │   │   ├── educationLoader.ts
│   │   │   ├── experienceLoader.ts
│   │   │   ├── projectLoader.ts # Loads index + individual project YAMLs
│   │   │   └── skillsLoader.ts
│   │   ├── content/             # YAML content files
│   │   │   ├── bio.yaml
│   │   │   ├── skills.yaml
│   │   │   ├── experience.yaml
│   │   │   ├── education.yaml
│   │   │   └── projects/
│   │   │       ├── index.yaml   # Project file list
│   │   │       └── *.yaml       # Individual project files
│   │   ├── data/
│   │   │   └── resume.ts        # Aggregates all loaders
│   │   ├── styles/
│   │   │   └── transitions.css  # CSSTransition styles
│   │   ├── App.tsx              # Main application component
│   │   ├── App.css              # All component styles (1224 lines)
│   │   ├── index.css            # Global/reset styles
│   │   └── main.tsx             # React entry point
│   ├── public/
│   │   └── headshot.png         # Profile photo
│   ├── dist/                    # Build output
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts           # Custom plugin for YAML copying
│   └── index.html
├── backend/                     # Flask API
│   ├── app.py                   # Main Flask application (320 lines)
│   ├── requirements.txt
│   └── .env                     # API keys (not in repo)
├── systemd/                     # Service configuration
│   ├── portfolio-frontend.service
│   └── portfolio-backend.service
└── README.md                    # Deployment documentation
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.0.2 | Type safety |
| Vite | 4.4.5 | Build tool and dev server |
| js-yaml | 4.1.0 | YAML parsing |
| react-transition-group | 4.4.5 | CSS transitions |

**Location**: `frontend/package.json:12-18`

```json
"dependencies": {
  "@types/js-yaml": "^4.0.9",
  "@types/react-transition-group": "^4.4.12",
  "js-yaml": "^4.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-transition-group": "^4.4.5"
}
```

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Flask | 3.0.0 | Web framework |
| Gunicorn | 21.2.0 | WSGI server |
| OpenAI | 1.3.5 | AI content generation |
| Flask-CORS | 4.0.0 | Cross-origin requests |
| Flask-Limiter | 3.5.0 | Rate limiting |

**Location**: `backend/requirements.txt`

### Infrastructure

| Component | Technology |
|-----------|------------|
| Web Server | Nginx (reverse proxy) |
| Process Manager | systemd |
| Frontend URL | https://crog.gg |
| Backend URL | https://api.crog.gg |

---

## Component Architecture

### Component Hierarchy

```
main.tsx
└── App.tsx (354 lines) ← GOD COMPONENT - handles everything
    ├── <header>
    │   ├── Profile photo
    │   ├── Name, location, email
    │   ├── Social links
    │   └── Typewriter.tsx (welcome message)
    ├── SectionNav.tsx (sticky navigation)
    ├── <main> (conditional rendering based on activeSection)
    │   ├── About.tsx (when activeSection === 'about')
    │   ├── Portfolio.tsx (when activeSection === 'experience'|'education'|'projects'|'music')
    │   └── Skills.tsx (when activeSection === 'skills')
    └── Action buttons (SUMMON NEW LORE / DISPEL ENCHANTMENT)
```

### Component Responsibilities

#### App.tsx (Lines: 354)
**Location**: `frontend/src/App.tsx`

**Current Responsibilities** (too many):
- State management for all content
- Loading initial data from YAML
- Handling content regeneration API calls
- Handling content reset
- Rendering header with profile info
- Rendering section navigation
- Conditional section rendering
- Rendering action buttons
- Event listener setup/cleanup

**State Variables** (Line 29-34):
```typescript
const [currentContent, setCurrentContent] = useState<any>(null);  // ⚠️ 'any' type
const [isLoading, setIsLoading] = useState(true);
const [isRegenerating, setIsRegenerating] = useState(false);
const [error, setError] = useState<string | null>(null);
const [hasModifiedContent, setHasModifiedContent] = useState(false);
const [activeSection, setActiveSection] = useState<string>('');
```

#### Portfolio.tsx (Lines: 323)
**Location**: `frontend/src/components/Portfolio.tsx`

**Current Responsibilities** (too many):
- Rendering Experience section
- Rendering Education section
- Rendering Projects section
- Rendering Music section
- Fetching GitHub language statistics
- Loading project data from YAML
- Managing internal navigation state

**This component should be split into 4 separate components.**

#### About.tsx (Lines: 95)
**Location**: `frontend/src/components/About.tsx`

**Responsibilities**:
- Display about text
- Listen for `contentRegenerated` events
- Fade transition during updates

**This component is appropriately sized.**

#### Skills.tsx (Lines: 87)
**Location**: `frontend/src/components/Skills.tsx`

**Responsibilities**:
- Render word cloud
- Shuffle skills randomly
- Size words by weight

**This component is appropriately sized.**

#### SectionNav.tsx (Lines: 63)
**Location**: `frontend/src/components/SectionNav.tsx`

**Responsibilities**:
- Render navigation buttons
- Track active section
- Handle section switching

**This component is appropriately sized.**

#### Typewriter.tsx
**Location**: `frontend/src/components/Typewriter.tsx`

**Responsibilities**:
- Animate text character-by-character
- Provide skip functionality
- Calculate height to prevent layout shift

**This component is appropriately sized.**

---

## Data Flow

### Initial Load Sequence

```
1. App.tsx mounts
   │
2. useEffect calls loadResumeData()
   │  Location: App.tsx:37-53
   │
3. loadResumeData() aggregates all loaders
   │  Location: frontend/src/data/resume.ts
   │
4. Each loader fetches its YAML file
   │  ├── bioLoader.ts → /content/bio.yaml
   │  ├── experienceLoader.ts → /content/experience.yaml
   │  ├── educationLoader.ts → /content/education.yaml
   │  ├── skillsLoader.ts → /content/skills.yaml
   │  └── projectLoader.ts → /content/projects/index.yaml → individual yamls
   │
5. Parsed data stored in currentContent state
   │
6. Components receive data via props
```

### Content Regeneration Flow

```
1. User clicks "SUMMON NEW LORE"
   │  Location: App.tsx:277-294
   │
2. handleRegenerate() called
   │  Location: App.tsx:78-141
   │
3. POST to /api/regenerate with current content
   │  Backend: backend/app.py:87-178
   │
4. Backend sends to OpenAI GPT-3.5-turbo
   │
5. Response updates currentContent state
   │
6. CustomEvent 'contentRegenerated' dispatched
   │  Location: App.tsx:125-128
   │
7. Components listen and update
   │  Example: About.tsx:23-35
```

### Event System (Current Pattern)

**Events Used**:
| Event Name | Dispatched From | Listened By |
|------------|-----------------|-------------|
| `contentRegenerated` | App.tsx:125 | About.tsx:23 |
| `contentUpdated` | (legacy, may be unused) | - |

**Why This Is Problematic**:
- Events bypass React's unidirectional data flow
- Hard to trace where data changes originate
- No TypeScript safety on event payloads
- Components can get out of sync

---

## Current Patterns

### Pattern 1: YAML Content Loading

**How it works**:
```typescript
// Location: frontend/src/utils/bioLoader.ts

import yaml from 'js-yaml';
import { BioData } from '../types/Bio';

export const loadBio = async (): Promise<BioData> => {
  try {
    const response = await fetch('/content/bio.yaml');
    if (!response.ok) {
      throw new Error(`Failed to fetch bio.yaml: ${response.statusText}`);
    }
    const content = await response.text();
    const bioData = yaml.load(content) as BioData;
    return bioData;
  } catch (error) {
    console.error('Error loading bio from YAML:', error);
    throw error;
  }
};
```

**Pattern Notes**:
- Each loader follows identical structure
- Type assertion (`as BioData`) provides no runtime validation
- Error handling rethrows after logging
- Files fetched from `/content/` path (Vite copies them to dist)

### Pattern 2: Vite Plugin for YAML Copying

**Location**: `frontend/vite.config.ts:8-36`

```typescript
function copyContentPlugin(): Plugin {
  return {
    name: 'copy-content',
    writeBundle() {
      const srcDir = resolve(__dirname, 'src/content');
      const destDir = resolve(__dirname, 'dist/content');

      // Recursively copy all files
      const copyRecursive = (src: string, dest: string) => {
        // ... implementation
      };

      copyRecursive(srcDir, destDir);
    }
  };
}
```

**Pattern Notes**:
- Custom Vite plugin copies YAML at build time
- Makes content accessible at runtime via `/content/` path
- **Problem**: New YAML files must be manually added to plugin

### Pattern 3: CSS Transitions with react-transition-group

**Location**: `frontend/src/components/Portfolio.tsx:283-297`

```typescript
<CSSTransition
  in={activeTab === 'experience'}
  timeout={300}
  classNames="section"
  unmountOnExit
>
  <div className="tab-content">
    {/* content */}
  </div>
</CSSTransition>
```

**CSS Location**: `frontend/src/styles/transitions.css`

```css
.section-enter {
  opacity: 0;
}
.section-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in;
}
.section-exit {
  opacity: 1;
}
.section-exit-active {
  opacity: 0;
  transition: opacity 300ms ease-in;
}
```

### Pattern 4: Window CustomEvents

**Dispatching** (Location: App.tsx:125-128):
```typescript
window.dispatchEvent(new CustomEvent('contentRegenerated', {
  detail: { section: activeSection, content: data }
}));
```

**Listening** (Location: About.tsx:23-35):
```typescript
useEffect(() => {
  const handleContentRegenerated = (event: CustomEvent) => {
    if (event.detail.section === 'about') {
      setDisplayText(event.detail.content.about_text);
    }
  };

  window.addEventListener('contentRegenerated', handleContentRegenerated as EventListener);
  return () => {
    window.removeEventListener('contentRegenerated', handleContentRegenerated as EventListener);
  };
}, []);
```

**Why This Pattern Exists**:
- Allows child components to react to API responses
- Avoids prop drilling through multiple levels
- **Should be replaced** with React Context or Zustand

---

## Technical Debt Inventory

### Critical (Must Fix in Phase 1)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| `any` type on currentContent | App.tsx:29 | No type safety on main state | Create `ContentState` interface |
| No routing | Entire app | Can't add project pages | Add React Router |
| Duplicated button JSX | App.tsx:277-344 | Maintenance burden | Extract `ActionButtons` component |

### High (Fix in Phase 2)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| God component | App.tsx | Hard to maintain, test | Split into smaller components |
| Portfolio handles 4 sections | Portfolio.tsx | Violates single responsibility | Split into 4 components |
| Event-based state updates | App.tsx, About.tsx | Hard to trace data flow | Use React Context/Zustand |
| Single CSS file (1224 lines) | App.css | No encapsulation, hard to maintain | CSS Modules or Tailwind |

### Medium (Fix in Phase 3-4)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| Hardcoded project list | vite.config.ts | Manual work to add projects | Dynamic glob pattern |
| No loading states | Various | Poor UX | Add skeleton loaders |
| No error boundaries | Entire app | Crashes break entire app | Add React Error Boundaries |
| Console.log statements | Various loaders | Clutters production console | Remove or use proper logging |

### Low (Fix When Convenient)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| Magic numbers in CSS | App.css | Hard to maintain consistency | CSS variables |
| No image optimization | public/headshot.png | Performance | Use next-gen formats |
| Inline styles in JSX | Various | Inconsistent with CSS approach | Move to CSS |

---

## Critical Files Reference

### Files You Will Modify Most

| File | Lines | Phase | Notes |
|------|-------|-------|-------|
| `frontend/src/App.tsx` | 354 | 1, 2 | Will be significantly refactored |
| `frontend/src/components/Portfolio.tsx` | 323 | 2 | Will be split into 4 files |
| `frontend/src/App.css` | 1224 | 4 | May be replaced with Tailwind |
| `frontend/package.json` | 32 | 1, 4 | Add new dependencies |
| `frontend/vite.config.ts` | ~50 | 3 | Update content copying |

### Files You Should NOT Modify (Initially)

| File | Reason |
|------|--------|
| `backend/app.py` | Backend changes come in Phase 6 |
| `frontend/src/content/*.yaml` | Content is fine, structure is fine |
| `frontend/src/types/*.ts` | Types are well-defined |
| `systemd/*` | Infrastructure is working |

### Files You Will Create

| Phase | New Files |
|-------|-----------|
| Phase 1 | `src/router.tsx`, `src/pages/Home.tsx`, `src/types/Content.ts` |
| Phase 2 | `src/components/sections/*.tsx`, `src/hooks/*.ts`, `src/store/*.ts` |
| Phase 3 | `src/pages/projects/*.tsx`, `src/components/templates/*.tsx` |
| Phase 4 | `tailwind.config.js`, `src/components/common/*.tsx` |
| Phase 5 | `src/components/SEO.tsx`, various meta files |
| Phase 6 | New backend endpoints, `src/utils/github.ts` |

---

## How to Verify Understanding

Before proceeding to Phase 1, you should be able to answer:

1. **Where is all application state managed?**
   - Answer: `App.tsx`, lines 29-34

2. **How does content get from YAML files to components?**
   - Answer: Vite copies YAML to dist → Loaders fetch and parse → App.tsx stores in state → Props to components

3. **What happens when user clicks "SUMMON NEW LORE"?**
   - Answer: App.tsx:78-141 calls `/api/regenerate`, updates state, dispatches CustomEvent

4. **Why can't we add a new page for a project right now?**
   - Answer: No router - entire app is a single page with conditional rendering

5. **What are the 3 most problematic files and why?**
   - Answer: App.tsx (god component), Portfolio.tsx (4 sections in 1), App.css (1224 lines, no modules)

---

## Next Steps

Once you've read and understood this document:
1. Proceed to [02-architecture-roadmap.md](./02-architecture-roadmap.md)
2. Then follow phases in order starting with [03-phase-1-foundation.md](./03-phase-1-foundation.md)

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
