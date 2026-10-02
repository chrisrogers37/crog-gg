# CLAUDE.md - Project Instructions for Claude Code

This file provides project-specific guidance for Claude Code. Update this file whenever Claude does something incorrectly so it learns not to repeat mistakes.

## Project Overview

**crog.gg** - The front door for Claudlobby (Chris's agent-fleet compositor for software "dark factories") on `/`, and **Choose Your Own Chris**, the personal portfolio with AI-regenerated content, on `/about`. React + TypeScript frontend, Flask backend deployed as a single Vercel Python Function.

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand for state
- **Backend**: Flask (`api/index.py`) on Vercel Python runtime, OpenAI API, Upstash Redis for rate limiting
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Deployment**: Full Vercel — frontend (static) + Python API functions (`api/index.py`) on crog.gg, rate-limit/cooldown state in Upstash Redis

## Development Workflow

Give Claude verification loops for 2-3x quality improvement:

1. Make changes
2. Run typecheck: `cd frontend && npm run typecheck` (the app, unit tests and e2e; `npm run build` checks only the app)
3. Run tests: `cd frontend && npm run test:run`
4. Lint before committing: `cd frontend && npm run lint`
5. Before creating PR: run full lint and test suite

## Git Hooks

Husky pre-commit and pre-push hooks enforce quality locally, once installed: run `npm install` at the root of each checkout or worktree (husky's `prepare` sets git's `core.hooksPath` to `.husky/_`, which isn't committed, so a new worktree has none). Without that, git runs neither hook, and CI is the only gate.

- **Pre-commit**: `lint-staged` runs ESLint on staged `.ts`/`.tsx` files
- **Pre-push**: Runs `npm run lint`, `npm run typecheck`, `npm run build` and `npm run test:run` when `frontend/` changed, as CI's lint, unit-test and build jobs do, and CI's API Lint and API Tests commands when the Python side changed (exact paths and commands in `.husky/pre-push`)
- A missing Python tool fails the push: `pip install -r requirements-dev.txt`, or `SKIP_PY_CHECKS=1 git push` to skip just that half (CI still runs it)
- Bypass with `--no-verify` when needed (e.g., WIP commits)

## Commands Reference

```sh
# Frontend commands (run from /frontend directory)
npm run dev              # Start dev server (localhost:5173)
npm run build            # TypeScript check + Vite build
npm run lint             # ESLint
npm run typecheck        # tsc over the app, unit tests and e2e (tsconfig.test.json)
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # E2E tests with visible browser

# Backend commands (run from repo root)
python3 -m api.index     # Start Flask dev server on :5001 (Vite proxies /api to it)
pip install -r requirements-dev.txt  # Install Python deps plus pytest, flake8, black and isort

# Git workflow
git status              # Check current state
git diff                # Review changes before commit
```

## Code Style & Conventions

### TypeScript/React

- Prefer `type` over `interface`; never use `enum` (use string literal unions instead)
- Use functional components with hooks
- Keep components small and focused
- Use Zustand for global state management
- Follow existing patterns in the codebase

### Python/Flask (`api/`)

- Follow PEP 8 style guide; enforced via `flake8 api --max-line-length=120 --ignore=E501,W503`
- Format with `black --line-length=120 api` and `isort --profile black api` (CI checks both)
- Use type hints where possible (Python 3.10+ syntax like `tuple[str, str | None]` is fine — CI runs 3.12)
- Keep Flask routes clean and focused
- Share helpers via `api/_lib/` (underscore prefix so Vercel doesn't treat them as separate functions)

### General

- Use descriptive variable names
- Write tests for new functionality
- Handle errors explicitly, don't swallow them
- Keep functions small and focused

## Things Claude Should NOT Do

- Don't use `any` type in TypeScript without explicit approval
- Don't skip error handling
- Don't commit without running tests first
- Don't make breaking API changes without discussion
- Don't modify .env files or commit secrets
- Don't add dependencies without discussing why
- Don't use `enum` in TypeScript - use string literal unions instead

## Project-Specific Patterns

### State Management

- Use Zustand stores in `frontend/src/store/`
- Follow existing store patterns for consistency

### API Integration

- In production, frontend calls same-origin `/api/*` (Flask function on the same Vercel domain). `VITE_API_URL` should be empty/unset in Vercel so the code default kicks in.
- For local dev: run `python3 -m api.index` from the repo root (port 5001); Vite dev proxy in `vite.config.ts` forwards `/api` requests there. `python api/index.py` fails with `ModuleNotFoundError`.
- Rate-limit/cooldown state lives in Upstash Redis (`api/_lib/redis_client.py`). The paid `/api/regenerate` path fails closed (503) when Redis is unavailable or not configured, so it can never run unmetered (#113); the free GitHub endpoints fail open. Don't "fix" a 503 by making the paid path fall open.

#### Backend Endpoints

| Endpoint                          | Method | Description                                   |
| --------------------------------- | ------ | --------------------------------------------- |
| `/api/regenerate`                 | POST   | AI content regeneration (30s cooldown per IP) |
| `/api/limits`                     | GET    | Current cooldown status                       |
| `/api/health`                     | GET    | Health checks for uptime monitors (200 / 503) |
| `/api/v1/github/repo/<name>`      | GET    | GitHub repo details                           |
| `/api/v1/github/readme/<name>`    | GET    | GitHub README content                         |
| `/api/v1/github/languages/<name>` | GET    | Language stats for repo                       |
| `/api/v1/github/languages`        | GET    | Aggregated language stats                     |
| `/api/v1/github/contributions`    | GET    | GitHub contribution calendar (GraphQL)        |

Backend env vars (set in Vercel project settings): `OPENAI_API_KEY` (required for `/api/regenerate`), `GITHUB_TOKEN` (required for `/api/v1/github/contributions`; bumps REST rate limits for other GitHub endpoints), `KV_REST_API_URL` + `KV_REST_API_TOKEN` (auto-injected by Upstash marketplace; if `UPSTASH_REDIS_REST_*` are set, the client reads them first).

### Styling

- Use Tailwind CSS classes
- CSS variables for theming defined in global styles
- Use Framer Motion for animations

### Testing

- Unit tests co-located with components in `__tests__` directories
- E2E tests in `frontend/e2e/`
- Mock external APIs in tests

### E2E Test Philosophy (IMPORTANT)

Tests should verify **structure and behavior**, not specific content:

- **DO**: Test that elements exist (headings, buttons, inputs)
- **DO**: Test that interactions work (clicking toggles state, forms accept input)
- **DO**: Use flexible selectors that match patterns, not exact classes
- **DO**: Skip tests gracefully when genuinely optional data (external APIs, live GitHub stats) isn't available
- **DON'T**: Test for exact text content that changes frequently
- **DON'T**: Hard-code copy like "hey there!" or "Welcome to my site"
- **DON'T**: Skip or vacuously pass when repo-shipped content is missing - YAML under `frontend/public/content/` ships with the repo, so a page rendering without it is a bug to fail on, not an environment to tolerate (see #120, where skip-gates hid a live production bug)

Example - Bad:

```typescript
await expect(page.getByText(/hey there!/i)).toBeVisible();
```

Example - Good:

```typescript
const welcomeArea = page.locator('.welcome-typewriter, [class*="welcome"]');
await expect(welcomeArea).toBeVisible();
```

### Content Files

- Content lives in `frontend/public/content/` as YAML files
- Exception: the homepage's Claudlobby copy is `frontend/src/content/claudlobby.ts`, a typed module bundled at build time (not fetched) so the hero renders immediately; its URLs are in `frontend/src/content/links.ts`. Wrap code terms in backticks there (they render as `<code>`). `claudlobby.test.ts` enforces its rules, on the copy and on `/`'s title, meta description, share card and JSON-LD: no em-dashes, other model providers named only in `maturity.planned` and `roadmap.next`, and every number carries a commit-pinned source and an `asOf` date. Claudlobby is open source (Apache-2.0 since 2026-09-30), so the page may say so
- Bio, experience, education, skills, timeline, showcase, projects all loaded from YAML
- Projects are in `frontend/public/content/projects/` directory
- Loading chain: `data/resume.ts` → `utils/*Loader.ts` → YAML files at runtime

## Design System

the site runs on a small, deliberate visual system. work inside it instead of defaulting to generic ui.

### Color Source of Truth

- the palette is defined ONCE in `frontend/src/styles/palette.ts` (the `primary` / `accent` / `slate` ramps).
- `frontend/tailwind.config.js` imports that palette, so every `bg-primary-600` / `text-slate-500` utility resolves back to the one file. tailwind is the canonical palette surface.
- `frontend/src/styles/tokens.ts` imports the same palette for js-side values, and `frontend/src/App.css` mirrors the shades by hand as css variables (plain css can't import js) with each var tagged by its shade.
- never hand-edit a color in only one of these. change `palette.ts` and let the rest follow; if you touch an `App.css` var, match it to the shade it tracks.

### Core Tokens

- read exact values from source, don't restate them here (a second copy drifts): color ramps in `frontend/src/styles/palette.ts`, spacing in `frontend/src/styles/tokens.ts` (`spacing`), fonts/type in `frontend/tailwind.config.js` (`fontFamily`).

### Do's and Don'ts (from design review)

- one filled primary button and one ghost / secondary button. don't add a third button style.
- one corner radius: 8px (`rounded-lg`). don't introduce new radii.
- subtract before you add. remove chrome that hasn't earned its place instead of layering more on.
- keep shadows minimal. whitespace separates sections, not stacked drop-shadows.
- icon-only buttons need an `aria-label`.
- respect the existing light / dark theming. every color has to work in both.

## Deployment

Deployed on Vercel. Every push to `main` auto-deploys to production at https://www.crog.gg, the canonical host (the apex `crog.gg` 308s to it, a Vercel domain setting); every push to any other branch gets a preview URL posted on the PR.

Every absolute self-URL (canonical, `og:url`, `og:image`, JSON-LD, sitemap, robots) comes from `SITE_URL` in `frontend/src/seo/site.ts`; don't hard-code the host anywhere else. `sitemap.xml` and `robots.txt` are generated at build time from the prerendered page list, so there are no static copies in `public/`.

### Layout

- Frontend: `frontend/` — Vite build, output at `frontend/dist`, served as static assets
- Every route is prerendered to its own HTML file carrying that page's title, description, canonical, Open Graph/Twitter tags and JSON-LD (`frontend/scripts/vite-prerender.ts`; page list in `frontend/src/seo/prerender.ts`, tags in `frontend/src/seo/site.ts`, which the `SEO` component also renders from). `vercel.json` serves them with `cleanUrls` and has **no SPA catch-all**, so an unknown path is a real 404 (`404.html`). A new route needs a prerendered page or it 404s in production; `src/router.test.tsx` fails until it has one, and `e2e/prerender.spec.ts` (its own Playwright project, run against `vite preview` of a real build) checks the heads the build actually wrote.
- Link-preview card: `frontend/public/og-image.png`, rendered from `frontend/scripts/og-image/og-image.html` (`node scripts/og-image/render.mjs`). Keep its text in step with `OG_IMAGE.alt` in `src/seo/site.ts`.
- Backend: `api/index.py` — Flask app deployed as a single Vercel Function under Fluid Compute; all `/api/*` routes are rewritten to it by `vercel.json`
- Shared helpers: `api/_lib/` (Upstash REST client, rate limiter, request utils)
- Python deps: edit `requirements.in` / `requirements-dev.in`, then regenerate the hash-pinned `requirements.txt` / `requirements-dev.txt` with the `uv pip compile` command in each file's header

### Vercel project env vars

- `OPENAI_API_KEY` — required for `/api/regenerate`
- `GITHUB_TOKEN` — required for `/api/v1/github/contributions` (GraphQL); bumps REST rate limits for the other GitHub endpoints. Use a token that can only read public data: a classic PAT with **no scopes**, or a fine-grained token set to "Public repositories (read-only)". Any authenticated token gets the 5000/hr REST quota and can run the GraphQL contributions query, so no scope is needed. Don't use `public_repo` (it can push to your public repos) or `repo`. The per-repo proxy endpoints (`repo` / `readme` / `languages`) enforce a public-only check in code as defense-in-depth, but the token itself must not be able to read private repos.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`: auto-injected by the Upstash Marketplace integration; if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set, the client reads them first
- `VITE_API_URL` — leave empty/unset so the frontend defaults to same-origin `/api/*`
- `VITE_SOURCE_REPO_URL`: the repo the footer's "view source" links to; unset, there's no link. Read at build time, so redeploy after changing it

### CI

- **CI** (`ci.yml`): Runs automatically on push — lint, test, build
- No separate deploy workflow; Vercel handles deploys directly from the Git integration

## Site copy style (crog.gg instance; forks replace this)

The copy uses a **casual, lowercase tone**:

- Use lowercase for casual/friendly copy
- **NEVER use em-dashes** (—) - use regular dashes or ellipses instead. The regenerate prompt's tone anchor (`_TONE_ANCHOR`) holds the model's rewrites to the same rule
- Keep it conversational, not corporate
- Example: "alright, here goes..." not "Here's what makes me tick—"

The site has two voices (#179), one per page:

- **`/` (Claudlobby): platform voice.** Plain, specific and honest, with no jokes or self-deprecation, because it asks developers to trust an autonomous tool with their repos. Sentence case, apart from the "i build things that build things." line. Copy is `frontend/src/content/claudlobby.ts`.
- **`/about` (and the rest of the portfolio): personal voice.** Lowercase, casual, jokes welcome, SUMMON NEW LORE included. Copy is `frontend/public/content/*.yaml`.
- **Claims on `/` stay honest.** Say what runs today (Claude Code only), and label anything planned as roadmap. The enforced rules are listed under Content Files.

## Image Handling

When working with images:

- **DON'T rotate images** unless explicitly requested - images are usually oriented correctly
- Use **CSS `object-position`** for cropping (e.g., `object-position: top` to hide bottom of image)
- Use **CSS `object-fit: cover`** for responsive image sizing
- Profile photos are served from `frontend/public/profile-photos/` as WebP variants. The originals are in `frontend/scripts/photos/originals/`: to add or change a photo, edit there and run `python frontend/scripts/photos/make-variants.py`

Example - cropping with CSS (not image manipulation):

```css
.profile-photo {
  object-fit: cover;
  object-position: top; /* Shows top of image, crops bottom */
}
```

---

_Update this file continuously. Every mistake Claude makes is a learning opportunity._
