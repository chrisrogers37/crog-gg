# Design Review: Projects Redesign

## 00_OVERVIEW.md

---

### Session Context

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| **Session**    | projects-redesign                                                    |
| **Date**       | 2026-02-17                                                           |
| **Scope**      | Full-site design review of crog.gg (Choose Your Own Chris portfolio) |
| **App URL**    | https://crog.gg                                                      |
| **Tech Stack** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion     |

### Design Goals

- **Playful but professional** through being impressive, not corporate
- **Target audience**: recruiters, colleagues, potential collaborators
- **Aesthetic inspiration**: Karpathy.ai - minimal, sleek, content-focused
- **Primary focus**: redesign the projects page with grid tiles and better ordering

---

### Screenshots Directory

All screenshots captured during the review are stored at:

```
/tmp/design-review/
```

**Available screenshots:**

| File                         | Page                             | Viewport |
| ---------------------------- | -------------------------------- | -------- |
| `home-desktop.png`           | Home (above fold)                | 1440x900 |
| `home-tablet.png`            | Home                             | 768x1024 |
| `home-mobile.png`            | Home                             | 375x812  |
| `projects-desktop.png`       | Projects listing                 | 1440x900 |
| `projects-tablet.png`        | Projects listing                 | 768x1024 |
| `projects-mobile.png`        | Projects listing                 | 375x812  |
| `project-detail-desktop.png` | Project detail (not found state) | 1440x900 |
| `project-detail-mobile.png`  | Project detail (not found state) | 375x812  |

---

### Phase Documents

| Phase | File                                    | Summary                                                                                                                                                             | Impact | Effort |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 01    | `01_normalize-yaml-data.md`             | Standardize non-standard fields in `<removed>.yaml` and `30-day-abs.yaml` (`github_url` to `github`, `demo_url` to `demo`)                                     | Low    | Low    |
| 02    | `02_reorder-projects-add-dead-redux.md` | Create `dead-redux.yaml`, reorder all projects by impact (Shuffify, Storyline AI, Dead Redux, a removed project, 30 Day A/Bs, City Cycles, GitHub), keep Hedwig hidden | High   | Low    |
| 03    | `03_fix-nav-spacing.md`                 | Fix "Chris Rogers" logo running into "Home" nav link on projects page                                                                                               | Low    | Low    |
| 04    | `04_fix-mobile-overflow.md`             | Fix section tab overflow and text clipping at 375px on home and projects pages                                                                                      | High   | Low    |
| 05    | `05_projects-grid-tiles-redesign.md`    | Convert projects page and home projects section from vertical list to compact visual tile grid                                                                      | High   | Medium |
| 06    | `06_loading-skeletons.md`               | Replace "Loading projects..." spinner with skeleton grid matching tile layout                                                                                       | Medium | Low    |

---

### Dependency Graph

```
Phase 01 (normalize YAML)
    |
    v
Phase 02 (reorder + dead-redux) -----> Phase 05 (grid tiles redesign)
                                              |
                                              v
                                        Phase 06 (loading skeletons)

Phase 03 (nav spacing)       [independent]
Phase 04 (mobile overflow)   [independent]
```

**Dependency details:**

- **Phase 01** has no dependencies. Touches only YAML files and projectLoader.ts.
- **Phase 02** depends on **Phase 01**. Both modify project YAML files.
- **Phase 03** has no dependencies. Isolated CSS fix in Navigation.css.
- **Phase 04** has no dependencies. Isolated CSS fix in SectionNav styles and ProjectsPage.css.
- **Phase 05** depends on **Phase 02**. Grid redesign needs correct project order and Dead Redux data.
- **Phase 06** depends on **Phase 05**. Skeleton must match grid tile layout.

---

### Parallel Execution Opportunities

```
         Time --->

Track A:  [Phase 01] --> [Phase 02] --> [Phase 05] --> [Phase 06]
Track B:  [Phase 03] ------------------------------------------>
Track C:  [Phase 04] ------------------------------------------>
```

- **Phases 01, 03, and 04** can all start immediately and run in parallel (disjoint files)
- **Phase 02** follows Phase 01
- **Phase 05** follows Phase 02
- **Phase 06** follows Phase 05

---

### Estimated Total Effort

**~2-3 sessions of focused implementation work:**

- **Session 1**: Phases 01, 02, 03, 04 (all low effort, high parallelism)
- **Session 2**: Phase 05 (medium effort - core grid tile redesign)
- **Session 3** (partial): Phase 06 (low effort - skeleton loaders)

---

### Key Files Reference

| File                                                        | Relevant Phases |
| ----------------------------------------------------------- | --------------- |
| `frontend/public/content/projects/index.yaml`               | 02              |
| `frontend/public/content/projects/<removed>.yaml`      | 01, 02          |
| `frontend/public/content/projects/30-day-abs.yaml`          | 01, 02          |
| `frontend/public/content/projects/dead-redux.yaml` (new)    | 02              |
| `frontend/src/utils/projectLoader.ts`                       | 01 (reference)  |
| `frontend/src/components/layout/Navigation/Navigation.css`  | 03              |
| `frontend/src/components/SectionNav.tsx`                    | 04              |
| `frontend/src/pages/Projects/ProjectsPage.tsx`              | 04, 05, 06      |
| `frontend/src/pages/Projects/ProjectsPage.css`              | 04, 05          |
| `frontend/src/components/sections/Projects/Projects.tsx`    | 05, 06          |
| `frontend/src/components/sections/Projects/Projects.css`    | 05, 06          |
| `frontend/src/components/sections/Projects/ProjectCard.tsx` | 05              |
