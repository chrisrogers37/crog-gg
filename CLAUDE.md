# CLAUDE.md - Project Instructions for Claude Code

This file provides project-specific guidance for Claude Code. Update this file whenever Claude does something incorrectly so it learns not to repeat mistakes.

## Project Overview

**Choose Your Own Chris** - An interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. React + TypeScript frontend, Flask backend deployed as a single Vercel Python Function.

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand for state
- **Backend**: Flask (`api/index.py`) on Vercel Python runtime, OpenAI API, Upstash Redis for rate limiting
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Deployment**: Full Vercel — frontend (static) + Python API functions (`api/index.py`) on crog.gg, rate-limit/cooldown state in Upstash Redis

## Development Workflow

Give Claude verification loops for 2-3x quality improvement:

1. Make changes
2. Run typecheck: `cd frontend && npm run build` (tsc is part of build)
3. Run tests: `cd frontend && npm run test:run`
4. Lint before committing: `cd frontend && npm run lint`
5. Before creating PR: run full lint and test suite

## Git Hooks

Husky pre-commit and pre-push hooks enforce quality locally:

- **Pre-commit**: `lint-staged` runs ESLint on staged `.ts`/`.tsx` files
- **Pre-push**: Runs `npm run build`, `npm run test:run`, and Python linting on `api/` (flake8, black, isort) when `api/` files changed
- Bypass with `--no-verify` when needed (e.g., WIP commits)

## Commands Reference

```sh
# Frontend commands (run from /frontend directory)
npm run dev              # Start dev server (localhost:5173)
npm run build            # TypeScript check + Vite build
npm run lint             # ESLint
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # E2E tests with visible browser

# Backend commands (run from repo root)
python api/index.py      # Start Flask dev server on :5001 (Vite proxies /api to it)
pip install -r requirements.txt  # Install Python deps (flask, flask-cors, openai, requests)

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
- For local dev: run `python api/index.py` on port 5001; Vite dev proxy in `vite.config.ts` forwards `/api` requests there.
- Rate-limit/cooldown state lives in Upstash Redis (`api/_lib/redis_client.py`); helpers fall open on Redis errors so the site stays up if Upstash is unavailable.

#### Backend Endpoints

| Endpoint                          | Method | Description                                   |
| --------------------------------- | ------ | --------------------------------------------- |
| `/api/regenerate`                 | POST   | AI content regeneration (30s cooldown per IP) |
| `/api/limits`                     | GET    | Current cooldown status                       |
| `/api/v1/github/repo/<name>`      | GET    | GitHub repo details                           |
| `/api/v1/github/readme/<name>`    | GET    | GitHub README content                         |
| `/api/v1/github/languages/<name>` | GET    | Language stats for repo                       |
| `/api/v1/github/languages`        | GET    | Aggregated language stats                     |
| `/api/v1/github/contributions`    | GET    | GitHub contribution calendar (GraphQL)        |

Backend env vars (set in Vercel project settings): `OPENAI_API_KEY` (required for `/api/regenerate`), `GITHUB_TOKEN` (required for `/api/v1/github/contributions`; bumps REST rate limits for other GitHub endpoints), `KV_REST_API_URL` + `KV_REST_API_TOKEN` (auto-injected by Upstash marketplace; client also accepts `UPSTASH_REDIS_REST_*` as fallbacks).

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

Deployed on Vercel. Every push to `main` auto-deploys to production at https://crog.gg; every push to any other branch gets a preview URL posted on the PR.

### Layout

- Frontend: `frontend/` — Vite build, output at `frontend/dist`, served as static assets
- Backend: `api/index.py` — Flask app deployed as a single Vercel Function under Fluid Compute; all `/api/*` routes are rewritten to it by `vercel.json`
- Shared helpers: `api/_lib/` (Upstash REST client, rate limiter, request utils)
- Python deps: `requirements.txt` at repo root

### Vercel project env vars

- `OPENAI_API_KEY` — required for `/api/regenerate`
- `GITHUB_TOKEN` — required for `/api/v1/github/contributions` (GraphQL); bumps REST rate limits for the other GitHub endpoints. Scope to **public repositories only**: a classic PAT with `public_repo` (NOT `repo`), or a fine-grained token with read-only access to public repos (Contents: Read, Metadata: Read) and no private-repo access. `public_repo` already grants the 5000/hr REST quota and authorizes the GraphQL contributions query, so private scope is never needed. The per-repo proxy endpoints (`repo` / `readme` / `languages`) enforce a public-only check in code as defense-in-depth, but the token itself must not be able to read private repos.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — auto-injected by the Upstash Marketplace integration; client also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as fallbacks
- `VITE_API_URL` — leave empty/unset so the frontend defaults to same-origin `/api/*`

### CI

- **CI** (`ci.yml`): Runs automatically on push — lint, test, build
- No separate deploy workflow; Vercel handles deploys directly from the Git integration

## Tone & Content Style

Chris prefers a **casual, lowercase tone** in content:

- Use lowercase for casual/friendly copy
- **NEVER use em-dashes** (—) - use regular dashes or ellipses instead
- Keep it conversational, not corporate
- Example: "alright, here goes..." not "Here's what makes me tick—"

## Image Handling

When working with images:

- **DON'T rotate images** unless explicitly requested - images are usually oriented correctly
- Use **CSS `object-position`** for cropping (e.g., `object-position: top` to hide bottom of image)
- Use **CSS `object-fit: cover`** for responsive image sizing
- Profile photos are in `frontend/public/profile-photos/`

Example - cropping with CSS (not image manipulation):

```css
.profile-photo {
  object-fit: cover;
  object-position: top; /* Shows top of image, crops bottom */
}
```

---

_Update this file continuously. Every mistake Claude makes is a learning opportunity._
