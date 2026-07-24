# System Review & Tech-Debt Triage — 2026-07-02

A full-system review of crog.gg (React + TypeScript frontend, Flask-on-Vercel
backend, Upstash Redis). This is a living tracker: check items off as they land,
link the PR next to each one.

> GitHub Issues were not reachable from the automation that produced this file
> (the integration lacks `repository.issues` access), so triage lives here as a
> markdown tracker. Promote any of these to real GitHub Issues when convenient —
> the IDs below make good issue titles.

## How to read this

- **Severity** — `P1` = broken/user-facing or security, `P2` = real debt with
  clear cost, `P3` = polish / nice-to-have.
- **Evidence** points at the specific file/line so the fix is unambiguous.
- Each item is intentionally small enough to be one PR.

## Summary

| ID                  | Severity | Area         | Title                                                                                                                                              |
| ------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BUG-1](#bug-1)     | P1       | Routing/data | Direct navigation to `/projects` and `/projects/:slug` never loads content                                                                         |
| [BUG-2](#bug-2)     | P1       | CI/tooling   | Pre-push hook lints a `backend/` dir that no longer exists — Python is never checked locally                                                       |
| [BUG-3](#bug-3)     | P2       | Build        | `vite.config.ts` `copy-content` plugin reads `src/content` (wrong path) with a stale file list                                                     |
| [BUG-4](#bug-4)     | P2       | Regeneration | Cooldown starts even when regeneration is skipped or fails; client cooldown desyncs from server                                                    |
| [BUG-5](#bug-5)     | P2       | Regeneration | One "regenerate" click fires 2 parallel API calls, consuming 2 daily-quota hits                                                                    |
| [BUG-6](#bug-6)     | P2       | Data         | `hedwig.yaml` project exists on disk but is missing from `index.yaml`; loader fallback list is stale                                               |
| [BUG-7](#bug-7)     | P2       | Robustness   | LLM output is stored in state with no shape validation                                                                                             |
| [DEBT-1](#debt-1)   | P2       | Dead code    | Unused legacy components still shipped (`Portfolio`, `Skills`, `Typewriter`, `SectionTiles`)                                                       |
| [DEBT-2](#debt-2)   | P2       | Architecture | `CustomEvent` bridge (`contentRegenerated` / `contentUpdated`) coexists with Zustand                                                               |
| [DEBT-3](#debt-3)   | P2       | Architecture | Regenerating "portfolio" updates data that is never rendered                                                                                       |
| [DEBT-4](#debt-4)   | P2       | Dead code    | Orphaned modules & store API (`Experience`/`Education` sections, `ContributionGraph`, `useScrollToSection`, `tokens.ts`, stale `types/content.ts`) |
| [DEBT-5](#debt-5)   | P2       | Styling      | Four competing styling systems; 1,300-line `App.css`; duplicated design tokens                                                                     |
| [DEBT-6](#debt-6)   | P2       | Data layer   | Duplicated loader boilerplate, no caching, refetch on every load/reset                                                                             |
| [DEBT-7](#debt-7)   | P3       | Architecture | `HomePage.tsx` is a 336-line god-component; no single source of truth for section config                                                           |
| [DEBT-8](#debt-8)   | P3       | Deps         | Orphan/misplaced dependencies (`react-transition-group` at root, `@types/js-yaml` in deps, `react-router`)                                         |
| [DEBT-9](#debt-9)   | P3       | Logging      | Debug `console.log` of full content objects left in loaders/components                                                                             |
| [DEBT-10](#debt-10) | P3       | Duplication  | Social links hardcoded in 3 places; GitHub username duplicated FE/BE                                                                               |
| [TEST-1](#test-1)   | P2       | Testing      | Python tests are not run in CI, and 5 of the backend surfaces are untested                                                                         |
| [TEST-2](#test-2)   | P2       | CI           | `black`/`isort` checks in CI never fail the build (`                                                                                               |     | echo`) |
| [TEST-3](#test-3)   | P2       | Testing      | Core frontend flows untested (contentStore, loaders, HomePage, regeneration hooks)                                                                 |
| [TEST-4](#test-4)   | P3       | CI           | No coverage thresholds; E2E has no backend and single browser                                                                                      |
| [SEC-1](#sec-1)     | P2       | Security     | `/api/regenerate` accepts arbitrary caller content and echoes LLM JSON back (abuse/cost surface)                                                   |
| [ENH-1](#enh-1)     | P3       | Enhancement  | Loaders/services have no runtime schema validation (zod)                                                                                           |
| [ENH-2](#enh-2)     | P3       | Enhancement  | `logoService` image probe has no timeout; failed GitHub fetches aren't cached                                                                      |

---

## Bugs

### BUG-1

**P1 — Direct navigation to `/projects` / `/projects/:slug` never loads content.**

`useContentLoader()` (which triggers `contentStore.loadContent()`) is only called
from `HomePage`:

```16:26:frontend/src/hooks/useContentLoader.ts
export function useContentLoader() {
  const loadContent = useContentStore((state) => state.loadContent);

  useEffect(() => {
    loadContent();
  }, [loadContent]);
  ...
}
```

`ProjectsPage` reads `projects` / `isLoading` from the store but never calls
`loadContent()` on mount (it only wires it to a Retry button). The store's
initial state is `isLoading: true, projects: []`, so a cold visit to `/projects`
renders the skeleton grid **forever**, and `/projects/:slug` shows a false
"Project Not Found".

- Store default: `isLoading: true` — `frontend/src/store/contentStore.ts:70`
- No mount load — `frontend/src/pages/Projects/ProjectsPage.tsx:19-49`
- Skeleton branch keyed on `isLoading` — `ProjectsPage.tsx:52-63`

**Fix direction:** call `useContentLoader()` (or trigger `loadContent()` with an
in-flight guard) from `Layout`/router level so every route has data, or add a
mount effect to the project pages.

- [ ] Fixed — PR: _____

---

### BUG-2

**P1 — Pre-push git hook targets a non-existent `backend/` directory; Python is never linted locally.**

The backend was ported to `api/`, but the hook still keys off `^backend/` and
`cd backend`:

```39:45:.husky/pre-push
if echo "$CHANGED_FILES" | grep -q "^frontend/"; then
  FRONTEND_CHANGED=true
fi

if echo "$CHANGED_FILES" | grep -q "^backend/"; then
  BACKEND_CHANGED=true
fi
```

```104:104:.husky/pre-push
    if (cd backend && flake8 --max-line-length 120 --exclude venv .); then
```

Consequences: edits under `api/` never set `BACKEND_CHANGED`, so backend
lint/format is silently skipped; and when change-detection fails the fallback
sets `BACKEND_CHANGED=true` then runs `cd backend` against a missing dir. Missing
tools also just print a message and allow the push (`pre-push:99-101`).

**Fix direction:** change `^backend/` → `^api/`, `cd backend` → `cd api` (or repo
root with `api` as the target), and align exclusions with CI (`ci.yml:143-171`).

- [ ] Fixed — PR: _____

---

### BUG-3

**P2 — `vite.config.ts` `copy-content` plugin reads the wrong path with a stale, hardcoded file list.**

Content actually lives in `frontend/public/content/` (auto-copied by Vite), but
the plugin copies from `src/content` (which does not exist) and enumerates files
by hand:

```33:36:frontend/vite.config.ts
      writeBundle() {
        // Copy content directory to dist
        const srcContent = join(__dirname, "src/content");
        const distContent = join(__dirname, "dist/content");
```

The `try/catch` swallows the error (`vite.config.ts:92-94`), so builds pass while
the plugin does nothing. The hardcoded list (`vite.config.ts:62-89`) is also out
of sync with `public/content/projects/` (e.g. it lists `github.yaml` and omits
`benzo.yaml`, `dead-redux.yaml`, `hedwig.yaml`).

**Fix direction:** delete the plugin entirely (Vite already copies `public/`), or
repoint it and make failures fail the build.

- [ ] Fixed — PR: _____

---

### BUG-4

**P2 — Regeneration cooldown starts even when the request is skipped or fails, and never syncs with the server.**

`regenerate()` fires the store action (fire-and-forget, not awaited) and then
unconditionally starts the client cooldown:

```23:30:frontend/src/hooks/useRegeneration.ts
  const regenerate = useCallback(
    (useFantasy: boolean = true) => {
      if (isOnCooldown) return;
      regenerateContent(useFantasy);
      startCooldown();
    },
    [regenerateContent, isOnCooldown, startCooldown],
  );
```

If the store early-returns (`!state.bio`) or the API errors, the user still eats a
30s client cooldown. Separately, `useCooldown` hardcodes `COOLDOWN_DURATION = 30`
(`useCooldown.ts:3`) and never calls the existing `GET /api/limits`
(`api/index.py:284-294`), so the client timer can drift from the server's
Redis-backed cooldown — the user can be shown "ready" and still get a 429.

**Fix direction:** await the result and only start the cooldown on success;
optionally reconcile with `/api/limits` on mount / after 429.

- [ ] Fixed — PR: _____

---

### BUG-5

**P2 — One "regenerate" click issues two parallel `/api/regenerate` calls.**

```148:174:frontend/src/store/contentStore.ts
          const sectionsToRegenerate = ["about", "portfolio"];
          const regenerationPromises = sectionsToRegenerate.map((section) =>
            fetch(`${API_URL}/api/regenerate`, {
              ...
          const responses = await Promise.all(regenerationPromises);
          const results = await Promise.all(responses.map((r) => r.json()));
```

Each POST independently consumes the per-IP daily quota
(`REGEN_DAILY_MAX = 30`, `api/index.py:56,188-190`), so effective budget is ~15
clicks/day. Also `.json()` is called without checking `response.ok` first, and if
either result has `success: false` the whole batch is discarded
(`contentStore.ts:176-213`). The second request may also hit the 30s cooldown the
first one just set, depending on ordering.

**Fix direction:** collapse to a single endpoint call, or make the two logical
sections one request; check `response.ok`; handle partial success.

- [ ] Fixed — PR: _____

---

### BUG-6

**P2 — Project content files are out of sync between disk, index, and the loader fallback.**

- `public/content/projects/hedwig.yaml` exists on disk but is **not** listed in
  `public/content/projects/index.yaml`, so it never loads.
- `projectLoader.ts` has a hardcoded fallback list used when the index fetch
  fails; it lists a stale subset (`shuffify`, `city-cycles`, `hedwig`, `github`)
  that no longer matches the 8 projects in `index.yaml`.
- The `vite.config.ts` copy list is a third, separate stale enumeration (see BUG-3).

**Fix direction:** pick a single source of truth (`index.yaml`), remove the
hardcoded fallback (or generate it), and either add `hedwig` to the index or
delete the file.

- [ ] Fixed — PR: _____

---

### BUG-7

**P2 — LLM output is written into app state without validating its shape.**

```181:188:frontend/src/store/contentStore.ts
            set({
              bio: aboutResult.content || state.bio,
              experience:
                portfolioResult.content?.experience || state.experience,
              education: portfolioResult.content?.education || state.education,
              hasModifiedContent: true,
              isRegenerating: false,
            });
```

The backend only checks that the model returned parseable JSON
(`api/index.py:260-272`); it does not enforce a schema. If the model returns a
string or a partially-shaped object, `bio`/`experience`/`education` become
malformed. The Home page mostly survives via optional chaining, but any component
that `.map()`s `experience`/`education` (e.g. the currently-orphaned
`Experience.tsx`) would crash if re-enabled.

**Fix direction:** validate `content` against the expected type (zod or a manual
guard) before committing to the store; fall back to previous state on mismatch.

- [ ] Fixed — PR: _____

---

## Architecture & Tech Debt

### DEBT-1

**P2 — Dead legacy components are still in the tree (and still shipped).**

Repo-wide grep shows zero imports for these:

- `frontend/src/components/Portfolio.tsx` (182 lines) — old monolithic section switcher
- `frontend/src/components/Skills.tsx` — only self-imports its own type
- `frontend/src/components/Typewriter.tsx` — superseded by `TypewriterLoop.tsx`
- `frontend/src/components/SectionTiles.tsx` (+ `SectionTiles.css`) — alternative nav never mounted

Associated dead CSS: `.portfolio-section` / `.skills-container` rules in
`App.css`. `Portfolio.tsx` is also the last real consumer of
`react-transition-group` besides `About.tsx` (see DEBT-8).

**Fix direction:** delete the files + their CSS and the matching `App.css` rules.

- [ ] Fixed — PR: _____

---

### DEBT-2

**P2 — `CustomEvent` bridge coexists with the Zustand store.**

`contentStore` both updates Zustand state and dispatches window events for
"legacy components":

```190:210:frontend/src/store/contentStore.ts
            // Dispatch events for legacy components that still use CustomEvent
            window.dispatchEvent(
              new CustomEvent("contentRegenerated", {
```

- `contentRegenerated` listeners live in `About.tsx:51-59`, plus dead
  `Portfolio.tsx` / `Skills.tsx`.
- `About.tsx` also dispatches `contentUpdated` (`About.tsx:63-71`) — **no one
  listens** to it.
- `About` mirrors store `bio` into local `useState` and animates via nested
  `setTimeout` chains, giving two update paths for the same data.

**Fix direction:** make `About` render straight from the store (`useBio()`),
delete the event dispatch/listeners and the dead `contentUpdated` path.

- [ ] Fixed — PR: _____

---

### DEBT-3

**P2 — Regenerating the "portfolio" section updates data that is never displayed.**

`regenerateContent` regenerates `experience` + `education` and stores them, but
the Journey section renders `Timeline` from a separate `timeline.yaml`, not the
store's `experience`/`education`. So half of every regeneration (and its daily-quota
cost, see BUG-5) has no visible effect. `useSkills()` /
`originalBio`/`originalExperience`/`originalEducation` are similarly loaded but
never read (`contentStore.ts:22-24,117-119`).

**Fix direction:** decide the product intent — either wire regeneration to what's
actually rendered (bio + timeline), or stop regenerating/loading the unused slices.

- [ ] Fixed — PR: _____

---

### DEBT-4

**P2 — Orphaned modules and store API kept "just in case".**

Exported but never imported by any page/route:

- `components/sections/Experience/` and `components/sections/Education/`
  (exported from `sections/index.ts`, never mounted; Journey uses `Timeline`)
- `components/features/ContributionGraph/`
- `hooks/useScrollToSection.ts`
- `styles/tokens.ts` (documented "source of truth" — imported nowhere)
- `data/resume.ts` `getRandomTransition()` + legacy `about`/`portfolio` fields
- `types/content.ts` (`ContentState`, `ContentProps`, `SectionId`) — stale
  `SectionId` still lists `experience|education|skills`; also name-collides with
  the store's own `ContentState` interface
- store selectors `useSkills`, `updateBio/updateExperience/updateEducation`,
  UI-store `toggleSection`/`clearActiveSection`/`useActiveSection`

**Fix direction:** delete what's truly dead; for anything intended for future use,
add a tracking note so it's a deliberate choice, not drift.

- [ ] Fixed — PR: _____

---

### DEBT-5

**P2 — Four competing styling systems and duplicated design tokens.**

- Legacy global stylesheet `App.css` (~1,309 lines) with `:root`/`.dark` CSS vars
- Tailwind (`index.css` `@layer` + `tailwind.config.js` theme)
- Unused JS design tokens `styles/tokens.ts` (never imported)
- `styles/transitions.css` for react-transition-group, **duplicating**
  `.fade-enter` / `.slide-up-enter` rules that also exist in `App.css:716-753`
- ~26 co-located component `.css` files

Same primary blue (`#2563eb`) is defined in `App.css`, `tailwind.config.js`, and
`tokens.ts`. `App.css` is imported twice (`App.tsx:1` and `HomePage.tsx:36`) and
its body styles fight `index.css` body styles by load order.

**Fix direction:** pick one token source (Tailwind theme), delete `tokens.ts` and
the duplicated transition rules, and shrink `App.css` (start by removing dead
Portfolio/Skills rules from DEBT-1).

- [ ] Fixed — PR: _____

---

### DEBT-6

**P2 — Loader boilerplate is duplicated, uncached, and refetched on every load/reset.**

`bioLoader`/`experienceLoader`/`educationLoader`/`skillsLoader` are near-identical
`fetch → text → yaml.load → as Type → log → throw`. There's no module- or
store-level cache, so `loadContent()` and `resetContent()` refetch all YAML each
time; `ImageShowcase` fetches `showcase.yaml` on its own path; and StrictMode
double-invokes the mount effect in dev (duplicate fetches). Error handling is
inconsistent (bio/exp/edu/skills throw; `showcaseLoader`/`timelineLoader` swallow
and return empties). `loadContent` also has no in-flight dedup guard.

**Fix direction:** extract a `loadYaml<T>(path)` helper, add a simple cache /
in-flight guard, and standardize error behavior.

- [ ] Fixed — PR: _____

---

### DEBT-7

**P3 — `HomePage.tsx` is a 336-line orchestrator; section config is triplicated.**

`HomePage` handles routing state, preview mode, per-section rendering, header,
nav, regeneration, SEO, mobile menu, and loading/error skeletons. The section
list (id/label/order) is duplicated across `SectionNav.tsx:8-13`,
`HomePage.tsx` `SECTION_ORDER`, and the MobileMenu `sections` prop (and dead
`SectionTiles.tsx`). Naming is also confusing: `SectionNav` (tab bar) vs
`SectionNavigator` (in-section "up next" button).

**Fix direction:** extract a single `sections.config.ts`, split `HomePage` into
smaller pieces, and rename one of the two nav components.

- [ ] Fixed — PR: _____

---

### DEBT-8

**P3 — Orphan / misplaced dependencies.**

- Root `package.json` declares `react-transition-group` as a dependency but the
  root has no source that uses it (`package.json:3-5`).
- `frontend/package.json` has `@types/js-yaml` in `dependencies` (should be
  `devDependencies`) and both `react-router` and `react-router-dom` (only
  `react-router-dom` is imported).
- `react-transition-group` in the frontend is only used by `About.tsx` (and dead
  `Portfolio.tsx`); could be replaced by Framer Motion (already the default) and
  dropped.
- `requirements.txt` has no `pytest`/`flake8`/`black`/`isort` (installed ad hoc in
  CI only).

- [ ] Fixed — PR: _____

---

### DEBT-9

**P3 — Debug logging of full content objects left in production paths.**

`console.log`/`console.error` dumping parsed content in
`bioLoader.ts:14`, `experienceLoader.ts:16`, `educationLoader.ts:14`,
`skillsLoader.ts:14`, `projectLoader.ts:78,138`, plus `Skills.tsx:32` and
`resume.ts:52`. (Error-boundary logging in `ErrorBoundary.tsx:42` is fine.)

**Fix direction:** remove or gate behind `import.meta.env.DEV`.

- [ ] Fixed — PR: _____

---

### DEBT-10

**P3 — Social links / GitHub username duplicated across files.**

GitHub/LinkedIn/Spotify URLs are hardcoded in `MobileMenu.tsx:127-153` and
`Footer.tsx:18-31` while `ContactCTA` sources them from `bio.yaml`. The GitHub
username string `chrisrogers37` is duplicated in `GitHubReadme.tsx` and backend
`api/_lib/request_utils.py:9`.

**Fix direction:** source social links from `bio.yaml` everywhere; centralize the
username (frontend constant / already-canonical backend).

- [ ] Fixed — PR: _____

---

## Testing & CI

### TEST-1

**P2 — Python tests don't run in CI, and most of the backend is untested.**

`ci.yml`'s API job only lints (`ci.yml:143-171`); `pytest` is never invoked.
`tests/test_github_proxy.py` covers only the GitHub proxy access-control paths
(with rate limiting mocked out). Untested: `POST /api/regenerate`,
`GET /api/limits`, `GET /api/v1/github/languages` (aggregate),
`GET /api/v1/github/contributions`, and all of `rate_limit.py` /
`redis_client.py` / `request_utils.py` (including the "fall open on Redis error"
behavior).

**Fix direction:** add a `pytest` step to CI; add unit tests for `rate_limit`
(sliding window + cooldown + fall-open) and the regenerate gate.

- [ ] Fixed — PR: _____

---

### TEST-2

**P2 — CI format checks can't fail the build.**

```167:171:.github/workflows/ci.yml
      - name: Check formatting with black
        run: black --check --line-length=120 api || echo "Black formatting check completed"

      - name: Check import sorting with isort
        run: isort --check-only --profile black api || echo "isort check completed"
```

The trailing `|| echo ...` makes both steps always exit 0, so formatting drift
never fails the build.

**Fix direction:** drop the `|| echo` so non-conformance fails, and add pytest.

- [ ] Fixed — PR: _____

---

### TEST-3

**P2 — Core frontend flows are untested.**

No tests for `contentStore` (`loadContent`/`regenerateContent`/`resetContent`,
error handling, event dispatch), the YAML loaders, `HomePage`, or the
regeneration hooks (`useRegeneration`/`useCooldown`). Existing tests are mostly
render/interaction smoke tests on presentational components. File ratio is ~17
test files to ~106 source files.

**Fix direction:** prioritize store + loader + cooldown tests (highest risk,
pure-ish logic).

- [ ] Fixed — PR: _____

---

### TEST-4

**P3 — Coverage/E2E gaps.**

- `vitest.config.ts` uploads coverage but sets no `thresholds`, so regressions
  don't fail CI.
- Playwright runs the Vite dev server only (no Flask on `:5001`), so `/api/*`
  behavior isn't exercised in E2E; Chromium-only.
- `tsconfig.json` excludes test files from `tsc`, so type errors in tests don't
  fail `npm run build`.

- [ ] Fixed — PR: _____

---

## Security / Robustness

### SEC-1

**P2 — `/api/regenerate` is an authenticated-by-nobody OpenAI proxy that echoes model JSON.**

The endpoint accepts arbitrary caller-supplied `content` and forwards it into an
OpenAI chat completion, returning the parsed JSON. It is gated by a 30s per-IP
cooldown + 30/day per-IP limit (good), but IP is the only control and the request
body size/`content` shape are unbounded (`api/index.py:208-255`). This is a cost
and prompt-abuse surface.

**Fix direction:** cap request body size and `content` length, constrain
`section` to the known set before doing work, and consider a global daily budget
in addition to per-IP.

- [ ] Addressed — PR: _____

---

## Enhancements

### ENH-1

**P3 — Add runtime schema validation for external data.**

Loaders cast YAML with `as Type` and services trust backend/LLM JSON shape with no
validation. A small zod (or hand-written guard) layer at the loader/service
boundary would turn silent bad-shape failures into clear, catchable errors
(supports BUG-6 and BUG-7).

- [ ] Done — PR: _____

---

### ENH-2

**P3 — Harden `logoService` and GitHub caching.**

`logoService` probes logos with `new Image()` and no timeout, so a hung request
never resolves (`logoService.ts:48-52`). `githubService` caches successes for 5
min but does not cache failures, so repeated errors hammer the backend
(`githubService.ts:66-90`). Add a probe timeout and short negative-cache.

- [ ] Done — PR: _____

---

_Generated 2026-07-02 from a full read-through of `api/`, `frontend/src/`,
`.github/`, `.husky/`, and build/test config. Line references are against `main`
at the time of writing and may shift as fixes land._
