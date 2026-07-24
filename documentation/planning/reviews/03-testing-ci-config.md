# Testing, CI, Config, Styling & Deps Review — 2026-07-02

## Counts

| Category                                          | Count                                 |
| ------------------------------------------------- | ------------------------------------- |
| Frontend source files (excl. tests + `src/test/`) | ~102                                  |
| Frontend unit test files                          | 13                                    |
| Frontend E2E specs                                | 3                                     |
| Backend Python source files (`api/`)              | 4                                     |
| Backend Python test files                         | 1 (`tests/test_github_proxy.py`)      |
| Test : source file ratio                          | ~16% (no coverage threshold enforced) |

## 1. Test coverage

**Frontend tested:** `uiStore`, `githubService`, `logoService`, `dateUtils`,
`animations`, and 8 component `__tests__` dirs (`SectionNav`, `ImageShowcase`,
`Timeline`, `Music`, `ProjectCard`, `MobileMenu`, `SectionNavigator`,
`ContactCTA`) — mostly render/interaction smoke tests.

**Frontend untested (major):** `contentStore` (load/regenerate/reset/error/event
dispatch), all `utils/*Loader.ts`, `HomePage`, `ProjectsPage`/`ProjectDetailPage`,
regeneration hooks (`useRegeneration`/`useCooldown`), `useContentLoader`, GitHub
feature UI (`ContributionGraph`, `GitHubReadme`, `RepoStats`, `ProjectDemo`),
`SEO`, `ActionButtons`, `ThemeToggle`, `ErrorBoundary`, `data/resume.ts`,
App shell/routing (`App.tsx`, `router.tsx`, `main.tsx`).

**Backend tested:** `tests/test_github_proxy.py` covers GitHub proxy
access-control / no-oracle 404 for `repo`/`readme`/`languages/<name>`, with rate
limiting patched out (`:56-60`). `conftest.py` only adds repo root to `sys.path`.

**Backend untested:** `POST /api/regenerate` (OpenAI, cooldown gate, daily limit,
JSON validation, fantasy prompts), `GET /api/limits`, aggregate
`GET /api/v1/github/languages`, `GET /api/v1/github/contributions` (GraphQL),
all of `rate_limit.py` (sliding window, cooldown TTL, **fall-open on Redis
failure**), `redis_client.py`, `request_utils.py` (`get_client_ip`,
`validate_repo_name`), `_gh_rate_limit_or_429`, the 429 handler. No `pytest` in
`requirements.txt`.

## 2. CI (`.github/workflows/ci.yml`)

Jobs (all gate `ci-success`): frontend lint (`:14-36`), unit tests w/ coverage
(`:38-67`), E2E Playwright (`:69-110`), build (`:112-141`), API lint
(flake8/black/isort, `:143-171`). Node 20, Python 3.12.

**Gaps:**

- **No Python tests run** — API job only lints (`:143-171`).
- **black/isort don't gate** — `black --check ... || echo` and
  `isort --check-only ... || echo` always exit 0 (`:167-171`). See TEST-2.
- **No coverage threshold** — coverage uploaded as artifact but no `thresholds`
  in `vitest.config.ts:11-22`.
- **E2E runs dev server only** — no Flask on `:5001`, so `/api/*` isn't exercised
  (`playwright.config.ts:57-62`); Chromium only.
- **Build doesn't typecheck tests** — `tsconfig.json:20` excludes test files.

## 3. Git hooks (`.husky/`)

**Pre-commit:** `npx lint-staged` (ESLint on staged FE files only).

**Pre-push — fragile:**

- **Wrong backend path** — checks `^backend/` and runs flake8/black/isort in
  `backend/`, which does not exist (API lives in `api/`). `pre-push:43-45,104-120`.
  See BUG-2.
- `api/` changes never trigger backend checks.
- Missing tools silently skip (`:99-101`).
- Fallback runs the wrong dir when change detection fails (`:48-51`).
- No E2E, no FE lint on push; mixes merge-base diff with unstaged changes
  (`:31-33`).

## 4. Config

**`vite.config.ts`:** broken `copy-content` plugin reads `src/content` (doesn't
exist), stale hardcoded YAML list, errors swallowed (`:35-36,62-89,92-94`). See
BUG-3. Good manual chunks (`:12-25`); verbose dev-proxy logging (`:98-120`).

**`vitest.config.ts`:** `globals: true`; no coverage `thresholds`; excludes
`main.tsx`.

**`playwright.config.ts`:** `retries: 2` on CI can mask flakes; no API server in
`webServer`; workers=1.

**`tsconfig.json`:** `strict: true` + `noUnusedLocals/Parameters` (good); missing
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`;
tests excluded from build.

**`eslint.config.js`:** React Compiler rules off (`:35-37`);
`no-unused-vars: warn` (`:42-45`); `react-refresh/only-export-components: warn`.

**`tailwind.config.js`:** extended palette duplicates CSS vars / `tokens.ts`;
animations overlap Framer Motion and `@keyframes` in `App.css`.

## 5. Styling architecture — four competing systems

| Layer                  | Files                    | Role                                                         |
| ---------------------- | ------------------------ | ------------------------------------------------------------ |
| Legacy global CSS vars | `App.css:1-22`           | `--primary-color` etc.; ~1,309 lines total                   |
| Tailwind entry         | `index.css:1-98`         | `@tailwind` + `@layer` (`.btn`, `.card`, `.section-heading`) |
| Tailwind config        | `tailwind.config.js`     | Theme tokens/animations                                      |
| JS tokens (unused)     | `styles/tokens.ts`       | Documented "source of truth" — **never imported**            |
| Transition classes     | `styles/transitions.css` | react-transition-group classes                               |
| Co-located CSS         | ~26 files                | BEM-ish per feature                                          |

Duplication: `.fade-enter`/`.slide-up-enter` defined in both `App.css:716-753` and
`transitions.css:7-36`; primary blue `#2563eb` in three places (`App.css`,
`tailwind.config.js`, `tokens.ts`); body styles fight between `App.css:36-45` and
`index.css:11-18`; three animation mechanisms coexist (Framer Motion + CSS
transitions + react-transition-group). Largest: `App.css` (1,309),
`ProjectDetailPage.css` (226), `Timeline.css` (205). ~29 CSS files, ~3,500+ lines.

## 6. Dependencies

- **Root `package.json`:** `react-transition-group` declared but unused at root
  (`:3-5`); lint-staged hardcodes `frontend/node_modules/.bin/eslint`.
- **`frontend/package.json`:** `@types/js-yaml` in `dependencies` (should be dev);
  both `react-router` and `react-router-dom` (only `-dom` imported);
  `react-transition-group` used only by `About.tsx` (+ dead `Portfolio.tsx`).
- **`requirements.txt`:** loose ranges; no `pytest`/`flake8`/`black`/`isort`
  (installed ad hoc in CI only).
- `highlight.js` pulled transitively via `rehype-highlight` (implicit version).

## Priority summary

1. Backend test gap + pytest not in CI (TEST-1).
2. Pre-push backend path bug (BUG-2).
3. CI black/isort non-gating (TEST-2).
4. Core frontend flows untested (TEST-3).
5. Styling sprawl + unused `tokens.ts` (DEBT-5).
6. Dead code + broken vite copy plugin (DEBT-1, BUG-3).
7. Orphan root `react-transition-group` (DEBT-8).
