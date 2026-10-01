# crog.gg (formerly Choose Your Own Chris)

[![CI](https://github.com/chrisrogers37/crog-gg/actions/workflows/ci.yml/badge.svg)](https://github.com/chrisrogers37/crog-gg/actions/workflows/ci.yml)

An interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. The site showcases professional experience, projects, and musical endeavors with a unique twist - content can be regenerated on demand for a fresh perspective!

## Features

### Dynamic Content Generation

- **AI-Powered Regeneration**: Uses OpenAI's GPT-3.5 to create unique variations of content while maintaining factual accuracy
- **Fantasy Mode**: Transform professional experiences into epic fantasy narratives
- **Section-Specific Updates**: Ability to regenerate individual sections or the entire portfolio
- **Smooth Transitions**: Elegant animations when content changes

### Professional Sections

- **About Me**: Dynamic biography and professional summary
- **Experience**: Interactive work history with achievements
- **Education**: Academic background and qualifications
- **Skills**: Comprehensive list of technical and professional skills

### Portfolio Integration

- **Technical Projects**: Showcase of development work and side projects
- **Music Portfolio**: Integration with Spotify artist profile
- **Social Links**: Connected profiles and professional networks

### Technical Features

- **Modern Stack**: React + TypeScript frontend, Flask backend deployed as a single Vercel Python Function
- **Responsive Design**: Mobile-friendly layout with CSS Grid and Flexbox
- **Same-Origin API**: Frontend and `/api/*` served from the same Vercel domain — no CORS in production
- **Error Handling**: Robust error management for API interactions
- **Rate Limiting**: Per-IP cooldown on `/api/regenerate` (30s) and sliding-window limiter (30/min) on GitHub endpoints, backed by Upstash Redis
- **Smooth Animations**: Framer Motion transitions for content updates

### Testing & CI/CD

- **Unit Testing**: Vitest with React Testing Library
- **E2E Testing**: Playwright for browser automation
- **Continuous Integration**: GitHub Actions for automated testing
- **Code Quality**: ESLint + TypeScript strict mode; flake8 / black / isort for Python (`api/`)
- **Git Hooks**: Husky pre-commit (lint-staged) + pre-push (build, tests, Python lint when `api/` files changed)

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS + CSS Variables for theming
- Framer Motion for animations

### Backend

- Flask (`api/index.py`) deployed as a single Vercel Python Function under Fluid Compute
- OpenAI API
- Python 3.12 (`.python-version`). `requirements.in` lists `flask`, `flask-cors`, `openai` and `requests`; `requirements.txt` is the hash-pinned lock generated from it
- Upstash Redis (via Vercel Marketplace) for rate-limit and cooldown state

## Local Development Setup

### Prerequisites

- Node.js 24 (`.nvmrc`; CI and Vercel use it). 22.13+ also works. Avoid 25+, whose built-in localStorage breaks the jsdom unit tests
- Python 3.12 (`.python-version`; CI and Vercel use it)
- (Optional) OpenAI API key, for the AI regeneration (`/api/regenerate`)
- (Optional) GitHub PAT — needed for `/api/v1/github/contributions`, bumps rate limits everywhere else
- (Optional) Upstash Redis credentials, which `/api/regenerate` needs (see [Troubleshooting](#troubleshooting))

### Backend Setup

1. From the repo root, create a virtual environment and activate it:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies. `requirements-dev.txt` adds pytest, flake8, black and isort to the runtime lock in `requirements.txt`:

   ```bash
   pip install -r requirements-dev.txt
   ```

3. Set env vars. All of them are optional: copy [`.env.example`](.env.example) to `.env` (git-ignored), fill in what you need, then load it with `set -a; source .env; set +a`.

4. Start the Flask dev server from the repo root. It binds to `:5001`, and Vite proxies `/api/*` to it. Run it as a module; `python api/index.py` fails with `ModuleNotFoundError: No module named 'api'`:

   ```bash
   python3 -m api.index
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. No `.env` file is needed. Leave `VITE_API_URL` unset so the dev server proxies `/api/*` to the Flask server on `:5001` (see `frontend/.env.example`). Setting it to `http://localhost:5001` makes the browser block the API calls.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and visit `http://localhost:5173`

## Testing

### Running Unit Tests

```bash
cd frontend

# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Running E2E Tests

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

### CI/CD

The project uses GitHub Actions for continuous integration. On every push to `main` and on pull requests:

1. **Frontend Lint**: Runs ESLint to check code quality
2. **Frontend Unit Tests**: Runs Vitest with coverage reporting
3. **Frontend E2E Tests**: Runs Playwright browser tests
4. **Frontend Build**: Verifies production build succeeds
5. **API Lint**: Runs flake8, black, and isort against `api/`

There is no manually-triggered deploy workflow. Vercel deploys directly from the Git integration.

## Production Deployment

Deployed on Vercel. Every push to `main` auto-deploys to https://www.crog.gg (the canonical host; the apex `crog.gg` 308s to it); every push to any branch gets a preview URL posted on the PR.

### Layout

- Frontend: `frontend/` → Vite build → `frontend/dist`, served as static assets by Vercel. The build writes one HTML file per route with that page's meta/OG tags (`frontend/scripts/vite-prerender.ts`), `vercel.json` serves them with `cleanUrls`, and anything else is a real 404 (`404.html`).
- Backend: `api/index.py` — Flask app deployed as a single Vercel Python Function under Fluid Compute. `vercel.json` rewrites `/api/(.*)` → `/api/index` so Flask handles all internal routing.
- Shared helpers: `api/_lib/` (Upstash REST client, sliding-window rate limiter, request utils). Underscore prefix keeps Vercel from treating them as separate functions.
- Python deps: edit `requirements.in` (runtime) or `requirements-dev.in` (tools), then regenerate the hash-pinned `requirements.txt` and `requirements-dev.txt` with the `uv pip compile` command in each file's header. CI and Vercel install only from the hashed files.

### Vercel project env vars

| Var                                     | Required          | Notes                                                                                                                                                                                           |
| --------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                        | yes               | `/api/regenerate` won't work without it                                                                                                                                                         |
| `GITHUB_TOKEN`                          | yes (effectively) | required for `/api/v1/github/contributions` (GraphQL); bumps REST rate limits for the other GitHub endpoints                                                                                    |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | recommended       | Auto-injected by the Upstash Marketplace integration. Without them `/api/regenerate` returns 503 (see Troubleshooting). Client also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as fallbacks. |
| `VITE_API_URL`                          | leave empty       | If set to a non-empty value the frontend build will bake in that origin instead of calling same-origin `/api/*`                                                                                 |

### Provisioning Upstash Redis

1. Vercel → project → **Storage** → **Create Database** → **Marketplace** → **Upstash for Redis**
2. Pick the free tier (or Pay As You Go with **Auto Upgrade off** to bound cost)
3. Region: us-east-1 (matches Vercel `iad1`)
4. Connect to the project, all 3 environments (Production / Preview / Development)
5. Redeploy so the function picks up the new env vars

### Rollback

Vercel keeps every deployment. Roll back from the Deployments tab → ⋯ → Promote to Production on any prior build.

### Troubleshooting

| Symptom                                                                                | Likely cause                                                                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/regenerate` returns `"OpenAI API key not configured"`                            | `OPENAI_API_KEY` missing in Vercel env vars or last deploy predates the env var being set — set it and redeploy                         |
| `/api/v1/github/contributions` returns `"GitHub token required for contribution data"` | `GITHUB_TOKEN` missing — same fix                                                                                                       |
| `/api/regenerate` returns 503 `"Regeneration temporarily unavailable"`                 | Upstash env vars missing or DB not connected to the project. The paid endpoint fails closed on Redis errors (the GitHub endpoints fail open), so fix Upstash, not the endpoint |
| `/api/regenerate` failures with reason `model_error`                                    | The OpenAI key is invalid, or its quota or budget is used up. Check the OpenAI usage page.                                               |
| Project pages show "No README available" or no repo stats                              | A GitHub API error: `GITHUB_TOKEN` expired or rate-limited, or GitHub is down. The proxy currently reports these as "not found".       |
| GitHub endpoints ignore rate limits                                                    | Upstash is unavailable. The free GitHub endpoints fail open by design.                                                                  |
| Frontend calls `https://api.crog.gg` instead of same-origin                            | `VITE_API_URL` in Vercel env vars points at the dead subdomain; clear it and redeploy                                                   |

## License

The code is released under the [MIT License](LICENSE). The personal content (bio, career history, photos and personal copy) isn't covered by it and stays all rights reserved; see [CONTENT-TERMS.md](CONTENT-TERMS.md). Third-party assets are credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
