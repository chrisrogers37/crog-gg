# Portfolio Planning Index

This directory holds active development plans. Completed plans are archived to `documentation/archive/`.

## Active

| Tracker                                                              | Description                                                                    | Status         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------- |
| [`tech-debt-triage_2026-07-02.md`](./tech-debt-triage_2026-07-02.md) | Full-system review: triaged bugs, tech debt, testing/CI gaps, and enhancements | 🔧 In progress |

---

## Completed initiatives (all archived)

### Foundation work (Feb 2026)

The original 6-phase enhancement plan that transformed the codebase from a single-page app into a modular, routed, content-aware React app.

| Phase                       | Description                                       | Status      |
| --------------------------- | ------------------------------------------------- | ----------- |
| Phase 1: Foundation         | React Router, HomePage, ActionButtons, types      | ✅ Complete |
| Phase 2: Modularity         | Zustand stores, custom hooks, section components  | ✅ Complete |
| Phase 3: Extensibility      | Project pages, dynamic routing, Layout component  | ✅ Complete |
| Phase 4: Visual Design      | Tailwind CSS, Framer Motion, design system        | ✅ Complete |
| Phase 5: SEO & Content      | react-helmet-async, SEO component, StructuredData | ✅ Complete |
| Phase 6: GitHub Integration | GitHub service, README rendering, repo stats      | ✅ Complete |

Archived as `documentation/archive/01-current-state-analysis.md` through `documentation/archive/11-migration-checklist.md`.

### Follow-on initiatives

| Initiative                                                    | Archive directory                         | Status      |
| ------------------------------------------------------------- | ----------------------------------------- | ----------- |
| Profile enhancement (hero, timeline, CTA)                     | `archive/profile-enhancement_2026-02-11/` | ✅ Complete |
| Design polish (mobile clipping, music, copy)                  | `archive/design-polish_2026-02-15/`       | ✅ Complete |
| Projects redesign (YAML normalization, grid tiles, skeletons) | `archive/projects-redesign_2026-02-17/`   | ✅ Complete |
| Security audit (Flask hardening, validation, rate limiting)   | `archive/security-audit_2026-02-22/`      | ✅ Complete |
| Vercel migration (DO → Vercel + Upstash)                      | `archive/vercel-migration_2026-05-17/`    | ✅ Complete |

---

## Current Architecture

```
frontend/src/
├── components/
│   ├── ActionButtons/      # Regenerate/reset controls
│   ├── common/             # Shared UI primitives
│   ├── features/           # GitHubReadme, RepoStats, ContributionGraph, ProjectDemo
│   ├── layout/             # Header, Footer, Layout
│   ├── sections/           # Experience, Education, Projects, Music
│   └── SEO/                # Meta tags, structured data
├── hooks/                  # useContentLoader, useRegeneration, useScrollToSection
├── pages/                  # Home, NotFound, Projects
├── services/               # githubService
├── store/                  # contentStore, uiStore (Zustand)
├── types/                  # TypeScript interfaces
└── router.tsx              # React Router configuration
```

---

---

_Last updated: 2026-07-02_
