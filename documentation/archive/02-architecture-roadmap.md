# 02 - Architecture Roadmap

## Purpose

This document defines the target architecture and explains the reasoning behind each architectural decision. Use this as your north star when implementing changes.

---

## Table of Contents

1. [Current vs Target Architecture](#current-vs-target-architecture)
2. [Directory Structure Evolution](#directory-structure-evolution)
3. [Technology Additions](#technology-additions)
4. [Data Flow Redesign](#data-flow-redesign)
5. [Component Architecture](#component-architecture)
6. [State Management Strategy](#state-management-strategy)
7. [Routing Architecture](#routing-architecture)
8. [Styling Architecture](#styling-architecture)
9. [API Architecture](#api-architecture)
10. [Architectural Decision Records](#architectural-decision-records)

---

## Current vs Target Architecture

### Current Architecture (SPA)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    App.tsx                           │   │
│   │              (God Component - 354 LOC)               │   │
│   │                                                      │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │
│   │   │ About   │ │Portfolio│ │ Skills  │ │SectionNav│  │   │
│   │   │         │ │(4 in 1) │ │         │ │         │  │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘  │   │
│   │                                                      │   │
│   │   State: currentContent, isLoading, activeSection    │   │
│   │   Events: contentRegenerated, contentUpdated         │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ fetch('/content/*.yaml')         │
│                           │ fetch('/api/regenerate')         │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Flask Backend                            │
│   /api/regenerate (OpenAI)    /api/github/languages         │
└─────────────────────────────────────────────────────────────┘
```

**Problems**:

- Single entry point, no deep linking
- All logic centralized in App.tsx
- Event-based communication is hard to trace
- Can't add new pages

### Target Architecture (Multi-Page with Router)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  React Router                        │   │
│   │                                                      │   │
│   │   /                    → HomePage                    │   │
│   │   /projects            → ProjectsPage                │   │
│   │   /projects/:slug      → ProjectDetailPage           │   │
│   │   /projects/:slug/demo → ProjectDemoPage             │   │
│   │   /*                   → NotFoundPage                │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  Zustand Store                       │   │
│   │                                                      │   │
│   │   content: { bio, experience, education, skills }    │   │
│   │   ui: { activeSection, isLoading, theme }           │   │
│   │   actions: { regenerate, reset, setSection }        │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  Component Tree                      │   │
│   │                                                      │   │
│   │   Layout (Header, Nav, Footer)                      │   │
│   │   ├── Pages (Home, Projects, ProjectDetail)         │   │
│   │   │   └── Sections (About, Experience, Skills...)   │   │
│   │   │       └── Common (Card, Button, Loading...)     │   │
│   │   └── Features (Typewriter, SkillCloud, GitHubStats)│   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Flask Backend (Enhanced)                 │
│   /api/v1/regenerate          /api/v1/github/languages      │
│   /api/v1/github/repo/:name   /api/v1/github/readme/:name   │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure Evolution

### Current Structure

```
frontend/src/
├── components/      # 5 mixed-concern components
├── types/           # TypeScript interfaces ✓
├── utils/           # Data loaders ✓
├── content/         # YAML files ✓
├── data/            # Resume aggregator
├── styles/          # Transition CSS only
├── App.tsx          # God component
├── App.css          # All styles
└── main.tsx         # Entry point
```

### Target Structure (After All Phases)

```
frontend/src/
├── components/
│   ├── common/              # Reusable UI primitives
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Loading/
│   │   ├── ErrorBoundary/
│   │   └── index.ts         # Barrel export
│   ├── layout/              # Page structure components
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Navigation/
│   │   └── PageContainer/
│   ├── sections/            # Home page sections
│   │   ├── About/
│   │   ├── Experience/
│   │   ├── Education/
│   │   ├── Skills/
│   │   ├── Projects/
│   │   └── Music/
│   └── features/            # Complex feature components
│       ├── Typewriter/
│       ├── SkillCloud/
│       ├── GitHubStats/
│       ├── ProjectCard/
│       └── ContentRegeneration/
├── pages/                   # Route-level components
│   ├── Home/
│   │   ├── HomePage.tsx
│   │   └── index.ts
│   ├── Projects/
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── index.ts
│   └── NotFound/
│       └── NotFoundPage.tsx
├── hooks/                   # Custom React hooks
│   ├── useContent.ts        # Content loading hook
│   ├── useRegeneration.ts   # AI regeneration hook
│   ├── useGitHub.ts         # GitHub API hook
│   └── useTheme.ts          # Theme switching hook
├── store/                   # Zustand state management
│   ├── contentStore.ts
│   ├── uiStore.ts
│   └── index.ts
├── services/                # API communication
│   ├── api.ts               # Base API client
│   ├── contentService.ts    # Content endpoints
│   └── githubService.ts     # GitHub endpoints
├── types/                   # TypeScript interfaces
│   ├── content.ts           # All content types
│   ├── api.ts               # API response types
│   └── index.ts
├── utils/                   # Utility functions
│   ├── loaders/             # YAML loaders
│   └── helpers/             # General utilities
├── content/                 # YAML content files
│   └── projects/
├── styles/                  # Global styles
│   └── globals.css
├── router.tsx               # React Router configuration
├── App.tsx                  # Minimal app shell
└── main.tsx                 # Entry point
```

---

## Technology Additions

### Phase 1: Foundation

```json
{
  "dependencies": {
    "react-router-dom": "^6.22.0"
  }
}
```

### Phase 2: State Management

```json
{
  "dependencies": {
    "zustand": "^4.5.0"
  }
}
```

### Phase 4: Visual Design

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",
    "@tailwindcss/typography": "^0.5.10"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

### Phase 5: SEO

```json
{
  "dependencies": {
    "react-helmet-async": "^2.0.4"
  }
}
```

### Phase 6: GitHub Integration

```json
{
  "dependencies": {
    "react-markdown": "^9.0.1",
    "rehype-highlight": "^7.0.0",
    "remark-gfm": "^4.0.0"
  }
}
```

---

## Data Flow Redesign

### Current Flow (Event-Based)

```
User Action
    │
    ▼
App.tsx handles event
    │
    ▼
App.tsx updates state
    │
    ▼
App.tsx dispatches CustomEvent ──► Child components listen
    │                                        │
    ▼                                        ▼
Props passed down                 Components update independently
```

**Problems**:

- Two sources of truth (props AND events)
- Components can get out of sync
- Hard to debug

### Target Flow (Unidirectional with Zustand)

```
User Action
    │
    ▼
Component calls store action
    │
    ▼
Zustand store updates
    │
    ▼
All subscribed components re-render
```

**Example Implementation**:

```typescript
// store/contentStore.ts
import { create } from "zustand";
import { ContentState, BioData, ExperienceItem } from "../types";
import { loadResumeData } from "../utils/loaders";
import { regenerateContent } from "../services/contentService";

interface ContentStore {
  // State
  bio: BioData | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: Project[];
  originalContent: ContentState | null;
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;
  hasModifiedContent: boolean;

  // Actions
  loadContent: () => Promise<void>;
  regenerate: (section: string, useFantasy: boolean) => Promise<void>;
  reset: () => void;
}

export const useContentStore = create<ContentStore>((set, get) => ({
  // Initial state
  bio: null,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  originalContent: null,
  isLoading: true,
  isRegenerating: false,
  error: null,
  hasModifiedContent: false,

  // Actions
  loadContent: async () => {
    try {
      set({ isLoading: true, error: null });
      const content = await loadResumeData();
      set({
        bio: content.bio,
        experience: content.experience,
        education: content.education,
        skills: content.skills,
        projects: content.projects,
        originalContent: content,
        isLoading: false,
      });
    } catch (error) {
      set({ error: "Failed to load content", isLoading: false });
    }
  },

  regenerate: async (section, useFantasy) => {
    try {
      set({ isRegenerating: true });
      const currentContent = get();
      const newContent = await regenerateContent({
        section,
        content: currentContent,
        useFantasy,
      });
      set({
        ...newContent,
        isRegenerating: false,
        hasModifiedContent: true,
      });
    } catch (error) {
      set({ error: "Failed to regenerate", isRegenerating: false });
    }
  },

  reset: () => {
    const original = get().originalContent;
    if (original) {
      set({
        bio: original.bio,
        experience: original.experience,
        education: original.education,
        skills: original.skills,
        projects: original.projects,
        hasModifiedContent: false,
      });
    }
  },
}));
```

**Component Usage**:

```typescript
// components/sections/About/About.tsx
import { useContentStore } from '../../../store/contentStore';

export function About() {
  // Only subscribes to bio - won't re-render when other content changes
  const bio = useContentStore((state) => state.bio);
  const isRegenerating = useContentStore((state) => state.isRegenerating);

  if (!bio) return <Loading />;

  return (
    <section className="about-section">
      {isRegenerating && <LoadingOverlay />}
      <p>{bio.about_text}</p>
    </section>
  );
}
```

---

## Component Architecture

### Component Categories

| Category     | Purpose                        | Examples                                                 |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| **Pages**    | Route-level containers         | HomePage, ProjectsPage, ProjectDetailPage                |
| **Layout**   | Page structure                 | Header, Footer, Navigation, PageContainer                |
| **Sections** | Home page content blocks       | About, Experience, Education, Skills, Projects, Music    |
| **Features** | Complex interactive components | Typewriter, SkillCloud, GitHubStats, ContentRegeneration |
| **Common**   | Reusable UI primitives         | Button, Card, Loading, ErrorBoundary, Input              |

### Component Design Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Build complex UIs from simple pieces
3. **Props for Configuration**: Use props for customization, not internal state
4. **Hooks for Logic**: Extract complex logic into custom hooks
5. **Barrel Exports**: Use index.ts files for clean imports

### Example Component Structure

```typescript
// components/sections/Experience/Experience.tsx
import { motion } from 'framer-motion';
import { useContentStore } from '../../../store/contentStore';
import { ExperienceCard } from './ExperienceCard';
import { SectionHeader } from '../../common/SectionHeader';
import styles from './Experience.module.css';

interface ExperienceProps {
  className?: string;
}

export function Experience({ className }: ExperienceProps) {
  const experience = useContentStore((state) => state.experience);

  return (
    <section className={cn(styles.experience, className)}>
      <SectionHeader title="Experience" />
      <div className={styles.cardGrid}>
        {experience.map((item, index) => (
          <motion.div
            key={item.company}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ExperienceCard experience={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

```typescript
// components/sections/Experience/ExperienceCard.tsx
import { ExperienceItem } from '../../../types';
import { Card } from '../../common/Card';
import styles from './ExperienceCard.module.css';

interface ExperienceCardProps {
  experience: ExperienceItem;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>{experience.title}</h3>
      <p className={styles.company}>{experience.company}</p>
      <p className={styles.period}>{experience.period}</p>
      <ul className={styles.achievements}>
        {experience.achievements.map((achievement, i) => (
          <li key={i}>{achievement}</li>
        ))}
      </ul>
    </Card>
  );
}
```

```typescript
// components/sections/Experience/index.ts
export { Experience } from "./Experience";
export { ExperienceCard } from "./ExperienceCard";
```

---

## State Management Strategy

### Store Separation

| Store          | Responsibility                               | Persistence  |
| -------------- | -------------------------------------------- | ------------ |
| `contentStore` | Bio, experience, education, skills, projects | No           |
| `uiStore`      | Theme, active section, modals, sidebar       | LocalStorage |

### Why Zustand Over Redux/Context

1. **Minimal Boilerplate**: No actions, reducers, providers
2. **TypeScript Native**: Full type inference
3. **Selective Subscriptions**: Components only re-render when their slice changes
4. **DevTools Support**: Works with Redux DevTools
5. **Small Bundle**: ~1KB gzipped

### Store Implementation Pattern

```typescript
// store/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  theme: "light" | "dark" | "system";
  activeSection: string;
  isSidebarOpen: boolean;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setActiveSection: (section: string) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "system",
      activeSection: "",
      isSidebarOpen: false,

      setTheme: (theme) => set({ theme }),
      setActiveSection: (section) => set({ activeSection: section }),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    },
  ),
);
```

---

## Routing Architecture

### Route Structure

```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/Home';
import { ProjectsPage, ProjectDetailPage } from './pages/Projects';
import { NotFoundPage } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'projects',
        children: [
          {
            index: true,
            element: <ProjectsPage />,
          },
          {
            path: ':slug',
            element: <ProjectDetailPage />,
          },
        ],
      },
    ],
  },
]);
```

### Route Table

| Path              | Component         | Description                      |
| ----------------- | ----------------- | -------------------------------- |
| `/`               | HomePage          | Main portfolio with all sections |
| `/projects`       | ProjectsPage      | Grid of all projects             |
| `/projects/:slug` | ProjectDetailPage | Individual project with README   |
| `/*`              | NotFoundPage      | 404 page                         |

### Navigation Patterns

```typescript
// Using React Router's Link
import { Link } from 'react-router-dom';

<Link to="/projects/shuffify">View Project</Link>

// Programmatic navigation
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/projects');

// Reading URL params
import { useParams } from 'react-router-dom';

const { slug } = useParams<{ slug: string }>();
```

---

## Styling Architecture

### Current: Single CSS File

- `App.css` (1224 lines)
- Global class names
- Risk of collisions
- Hard to maintain

### Target: Tailwind CSS + CSS Modules

**Tailwind for**:

- Utility classes
- Responsive design
- Dark mode
- Consistent spacing/colors

**CSS Modules for**:

- Component-specific styles
- Complex animations
- Scoped class names

### Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        // Map existing CSS variables
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

### Example Component with Tailwind

```typescript
// components/common/Card/Card.tsx
import { cn } from '../../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}
```

---

## API Architecture

### Current Endpoints

| Method | Endpoint                | Purpose                   |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/regenerate`       | AI content regeneration   |
| GET    | `/api/github/languages` | Language statistics       |
| GET    | `/api/limits`           | Token usage (placeholder) |

### Target Endpoints (After Phase 6)

| Method | Endpoint                      | Purpose                 |
| ------ | ----------------------------- | ----------------------- |
| POST   | `/api/v1/regenerate`          | AI content regeneration |
| GET    | `/api/v1/github/languages`    | Language statistics     |
| GET    | `/api/v1/github/repo/:name`   | Repository details      |
| GET    | `/api/v1/github/readme/:name` | Repository README       |
| GET    | `/api/v1/projects`            | All projects metadata   |
| GET    | `/api/v1/projects/:slug`      | Single project metadata |

### API Client Pattern

```typescript
// services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "https://api.crog.gg";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }

  async post<T, D>(path: string, data: D): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE);
```

---

## Architectural Decision Records

### ADR-001: React Router for Routing

**Status**: Accepted

**Context**: The application needs to support multiple pages for project showcases.

**Decision**: Use React Router v6 for client-side routing.

**Alternatives Considered**:

- Next.js: Would require rewriting entire app, overkill for current needs
- TanStack Router: Newer, less community support
- No router (current): Doesn't support requirements

**Consequences**:

- Can add new pages without restructuring
- SEO requires additional work (pre-rendering)
- Bundle size increases ~15KB

---

### ADR-002: Zustand for State Management

**Status**: Accepted

**Context**: Need to replace CustomEvent-based state updates with predictable state management.

**Decision**: Use Zustand for global state management.

**Alternatives Considered**:

- Redux Toolkit: More boilerplate, larger bundle
- React Context: Re-renders all consumers on any change
- Jotai/Recoil: Atomic model doesn't fit our data shape

**Consequences**:

- Simpler code than current CustomEvent approach
- Selective subscriptions prevent unnecessary re-renders
- Small learning curve for team

---

### ADR-003: Tailwind CSS for Styling

**Status**: Accepted

**Context**: Current single CSS file is unmaintainable. Need consistent design system.

**Decision**: Use Tailwind CSS with CSS Modules for complex components.

**Alternatives Considered**:

- styled-components: Runtime CSS-in-JS has performance cost
- CSS Modules only: Lacks utility classes and design system
- Keep current CSS: Unmaintainable at scale

**Consequences**:

- Faster development with utility classes
- Consistent spacing, colors, typography
- Learning curve for utility-first approach
- Build step required for purging unused CSS

---

### ADR-004: Keep Flask Backend

**Status**: Accepted

**Context**: Consider whether to keep Flask or migrate to Node.js/Next.js API routes.

**Decision**: Keep Flask backend, add API versioning.

**Rationale**:

- Backend is working and stable
- OpenAI integration already implemented
- No compelling reason to rewrite
- Can be replaced later if needed

**Consequences**:

- Two language ecosystems (Python + TypeScript)
- Deployment remains split (Nginx + Gunicorn)

---

## Next Steps

1. Read [03-phase-1-foundation.md](./03-phase-1-foundation.md) to begin implementation
2. Reference this document when making architectural decisions
3. Update ADRs if decisions change during implementation

---

_Document Version: 1.0.0_
_Last Updated: January 2026_
