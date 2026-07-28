# Frontend Architecture Review — 2026-07-02

The codebase is mid-migration: Zustand + organized folders (`sections/`,
`layout/`, `common/`, `features/`) are the active architecture, but legacy loose
components, window events, and unused section modules remain.

## 1. Loose components in `frontend/src/components/`

| File                     | Status   | Evidence                                                                                              |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| `About.tsx`              | **Used** | Imported by `pages/Home/HomePage.tsx:18`; rendered at `:123` and `:290`                               |
| `SectionNav.tsx`         | **Used** | Imported by `HomePage.tsx:25`; rendered at `:254`. Test in `components/__tests__/SectionNav.test.tsx` |
| `SectionFadePreview.tsx` | **Used** | Imported by `HomePage.tsx:26`; rendered at `:282-296`                                                 |
| `TypewriterLoop.tsx`     | **Used** | Imported by `HomePage.tsx:28`; rendered at `:230-247`                                                 |
| `Portfolio.tsx`          | **Dead** | Zero imports repo-wide (self-references only)                                                         |
| `Skills.tsx`             | **Dead** | Zero component imports; only `types/Skills.ts` is imported elsewhere                                  |
| `SectionTiles.tsx`       | **Dead** | Zero imports; co-located `SectionTiles.css` also unused                                               |
| `Typewriter.tsx`         | **Dead** | Zero imports; superseded by `TypewriterLoop.tsx`                                                      |

Four live components sit at the components root while newer code lives in
subfolders — they should move to match the tree (`sections/About/`,
`layout/SectionNav/`, etc.). Dead CSS: `App.css` still carries `.portfolio-section`
and `.skills-container` rules for the dead components.

## 2. `SectionNav` vs `SectionNavigator` — both used, confusingly named

Not duplicates, but the names collide.

| Component          | Path                                                      | Purpose                                                      | Used by                |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| `SectionNav`       | `components/SectionNav.tsx`                               | Horizontal tab bar (About / Journey / Projects / Music)      | `HomePage.tsx:254-257` |
| `SectionNavigator` | `components/common/SectionNavigator/SectionNavigator.tsx` | "up next: {section}" flow button at bottom of active section | `HomePage.tsx:150-153` |

`SectionNavigator` isn't re-exported from `components/common/index.ts`; `HomePage`
imports it directly.

## 3. Routing & component tree

Bootstrap: `main.tsx` → `App.tsx` → `AppRouter` (`router.tsx`) → `RouterProvider`.

| Route             | Page                | Load strategy   |
| ----------------- | ------------------- | --------------- |
| `/`               | `HomePage`          | Eager           |
| `/projects`       | `ProjectsPage`      | Lazy + Suspense |
| `/projects/:slug` | `ProjectDetailPage` | Lazy + Suspense |
| `*`               | `NotFoundPage`      | Eager           |

All routes wrap in `Layout` except the catch-all 404. The Home page opts out of
`Layout`'s header/nav and builds its own header + `SectionNav`.

- `Portfolio.tsx` is **not** used — Home renders section components directly in
  `renderActiveSection()` (`HomePage.tsx:116-156`).
- `About.tsx` is used twice (preview at `:290-293`, full at `:123-124`), both with
  `onRegenerate={() => {}}` (a no-op — dead wiring).

## 4. Duplicate / competing implementations

**Navigation systems (4 live + 1 dead):** page nav (`layout/Navigation`), section
tabs (`SectionNav`), section flow (`SectionNavigator`), mobile drawer
(`layout/MobileMenu`), and dead tile grid (`SectionTiles`). Section IDs are
duplicated across `SectionNav.tsx:8-13`, `HomePage.tsx` `SECTION_ORDER`, the
MobileMenu `sections` prop, and dead `SectionTiles.tsx` — no single source of
truth.

**Typewriters:** `Typewriter.tsx` (dead) vs `TypewriterLoop.tsx` (used).

**Experience/Education rendering (3 impls, 1 visible path):** inline in dead
`Portfolio.tsx`; dedicated `sections/Experience` + `sections/Education` (exported
but never imported by a page); and `sections/Timeline` (the live Journey view,
sourced from `timeline.yaml`). The section folders are complete but orphaned.

**Music (2 impls):** inline in dead `Portfolio.tsx` vs live `sections/Music`.

**Transition libraries (2 systems):** `react-transition-group` (`About.tsx`, dead
`Portfolio.tsx`) vs Framer Motion (everywhere else). `react-transition-group` is
kept alive almost entirely by `About.tsx`.

**Other dead feature modules:** `features/ContributionGraph/` (exported, never
mounted), `hooks/useScrollToSection.ts` (exported, never called), `styles/tokens.ts`
(never imported), `data/resume.ts` `getRandomTransition()` (never imported).

## 5. Legacy `CustomEvent` pattern vs Zustand

`contentStore` updates Zustand state **and** dispatches window events
(`contentRegenerated`) on both regenerate and reset (`contentStore.ts:190-210`,
`:248-271`).

| Listener          | File                  | Still needed?                                                       |
| ----------------- | --------------------- | ------------------------------------------------------------------- |
| About handler     | `About.tsx:51-59`     | Partially redundant — HomePage already passes `bio` from `useBio()` |
| Portfolio handler | `Portfolio.tsx:44-54` | Dead — component unused                                             |
| Skills handler    | `Skills.tsx:36-45`    | Dead — only `console.log`                                           |

`About.tsx` also dispatches `contentUpdated` (`:36-42`, `:64-70`) — **no listeners
anywhere**. Why this is fragile:

1. Dual source of truth: Zustand `bio` + `About` local `useState` + event listener.
2. Race-prone: `About.tsx:29-48` nested `setTimeout` chains triggered by events
   while props also update via `useEffect`.
3. Half the regeneration is invisible: the store regenerates `portfolio`
   (experience/education) but the UI shows `Timeline` from `timeline.yaml`.
4. Dead listeners kept in sync; no-op `onRegenerate` callback.

## 6. Large / over-scoped files

| File                                 | ~Lines | Problem                                                                                                   |
| ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------- |
| `App.css`                            | 1,309  | Monolithic legacy stylesheet; dead Portfolio/Skills rules; duplicated with component CSS                  |
| `pages/Home/HomePage.tsx`            | 336    | God-page: routing state, preview mode, section rendering, header, nav, regen, SEO, mobile menu, skeletons |
| `store/contentStore.ts`              | 334    | Store + API calls + legacy event dispatch; `ContentState` name collides with `types/content.ts`           |
| `sections/ContactCTA/ContactCTA.tsx` | 178    | ~75 lines of inline SVG icons                                                                             |
| `layout/MobileMenu/MobileMenu.tsx`   | 167    | Page nav + section nav + social links + theme                                                             |
| `components/Portfolio.tsx`           | 182    | Dead weight                                                                                               |
| `TypewriterLoop.tsx`                 | 148    | Five `useEffect`s for a state machine — could be one reducer                                              |

## 7. Additional findings

- **Content loading only on HomePage:** `useContentLoader()` is only called in
  `HomePage.tsx:66`. `ProjectsPage`/`ProjectDetailPage` read the store but never
  trigger `loadContent()` — direct navigation leaves the store empty. (See
  BUG-1.)
- **Stale types:** `types/content.ts` (`ContentState`, `ContentProps`,
  `SectionId`) never imported by runtime code; `SectionId` still lists the old
  `experience|education|skills` model.
- **Store data loaded but unused:** `useSkills()` never called; `useExperience()`/
  `useEducation()` only used by dead sections; `updateBio/updateExperience/
updateEducation` never called; `originalBio/originalExperience/originalEducation`
  stored but never read.
- **Duplicate `App.css` import:** `App.tsx:1` and `HomePage.tsx:36`.
- **Unused UI store API:** `toggleSection`, `clearActiveSection`, `useActiveSection`.
- **Social link duplication:** hardcoded in `MobileMenu.tsx:127-153` and
  `Footer.tsx:18-31`, while `ContactCTA` uses the canonical `bio.yaml`.

## Priority summary

| Priority | Finding                                                                          |
| -------- | -------------------------------------------------------------------------------- |
| High     | Dead components (`Portfolio`, `Skills`, `Typewriter`, `SectionTiles`)            |
| High     | CustomEvent bridge coexists with Zustand; `contentUpdated` has no listeners      |
| High     | Portfolio regeneration updates invisible data (Timeline uses separate YAML)      |
| High     | `loadContent()` only on HomePage → broken direct navigation                      |
| Medium   | Orphaned `Experience`/`Education` sections + store selectors                     |
| Medium   | `SectionNav` vs `SectionNavigator` naming; triplicated section config            |
| Medium   | `App.css` (1,309 lines) with dead styles                                         |
| Medium   | `ContributionGraph`, `useScrollToSection`, `tokens.ts`, stale `types/content.ts` |
| Low      | `About` rendered twice; no-op `onRegenerate`; drop `react-transition-group`      |
