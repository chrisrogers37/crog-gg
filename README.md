# crog.gg (formerly Choose Your Own Chris)

[![CI](https://github.com/chrisrogers37/crog-gg/actions/workflows/ci.yml/badge.svg)](https://github.com/chrisrogers37/crog-gg/actions/workflows/ci.yml)

crog.gg is two sites in one:
- **`/` is the front door for [Claudlobby](https://github.com/Claudfather/Claudlobby)**, Chris Rogers's agent-fleet compositor for software "dark factories": what it is, a quickstart, the roadmap, and how to follow releases.
- **`/about` is Choose Your Own Chris**, the personal portfolio. Its About section can be rewritten on demand by an AI model, as lore in a different register each time.

For how it's built, and what each content file does, see the [documentation index](documentation/README.md). To work on it, see [CONTRIBUTING.md](CONTRIBUTING.md); to make it your own site, [FORKING.md](FORKING.md).

## Features

### The Claudlobby landing page (`/`)

- Its copy is a typed module (`frontend/src/content/claudlobby.ts`), bundled so the hero needs no request, and its calls to action are counted ([Web Analytics](#web-analytics)).

### Choose Your Own Chris (`/about`)

- **Tabs:** About, Journey (a career timeline whose skill bubbles light up as you scroll), Projects, and Music (a Spotify embed and links).
- **SUMMON NEW LORE** rewrites the About section (the name at the top, the tagline, the text, and the location on the contact card) with OpenAI's `gpt-5.6-luna` (`OPENAI_MODEL` in `api/index.py`), told in a randomly picked register each press: a tavern song, a bestiary entry, sworn testimony. The model is told to keep the facts and numbers, and the email and links are put back after every rewrite. **DISPEL ENCHANTMENT** restores the original.
- **Rate limits** on `/api/regenerate`: a 30 s cooldown, plus daily caps of 30 rewrites per visitor and 300 site-wide. A press rewrites one section, so it uses one of each. An IPv6 /64 counts as one visitor. They're backed by Upstash Redis, and the paid endpoint refuses to run without it (see [Troubleshooting](#troubleshooting)).

### Projects (`/projects`)

- A searchable grid, and a page per project with live GitHub stats and the repo's README, fetched through a same-origin proxy that serves public repos only.

### Under the hood

- **One origin:** the static frontend and the Flask API (`/api/*`) are served from the same Vercel domain, so there's no CORS in production.
- **Prerendered heads:** each landing page ships its own title, description and social card, and the build generates the sitemap from the same page list (robots.txt points to it).
- **Light and dark themes:** light by default; the toggle cycles light, dark and system, which follows the OS.
- **Quality gates:** lint, type checks and tests on both halves, run by Husky locally and by [CI](#cicd) on every PR.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS + CSS Variables for theming
- Framer Motion for animations
- Zustand for state, react-router for routing

### Backend

- Flask (`api/index.py`) deployed as a single Vercel Python Function under Fluid Compute
- OpenAI API
- Python 3.12 (`.python-version`). `requirements.in` lists `flask`, `flask-cors`, `openai` and `requests`; `requirements.txt` is the hash-pinned lock generated from it
- Upstash Redis (via Vercel Marketplace) for rate-limit and cooldown state

## Local Development Setup

Run `npm install` once at the repo root: it installs the git hooks ([CONTRIBUTING](CONTRIBUTING.md#setup)). The frontend has its own install, below.

### Prerequisites

- Node.js 24. CI reads `.nvmrc` and Vercel reads `engines.node` in the root `package.json`, so bump both together. 22.13+ also works locally; avoid 25+, whose built-in localStorage breaks the jsdom unit tests
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

The checks CI runs, and where to run each, are the table in [CONTRIBUTING.md](CONTRIBUTING.md#before-you-open-a-pr). Below are the variants for development.

### Running Unit Tests

```bash
cd frontend

# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Type-check the app, the unit tests and e2e (CI runs this too)
npm run typecheck

# Run tests with coverage report
npm run test:coverage
```

### Running the API Tests

`conftest.py` stubs Redis, so pytest needs no secrets. From the repo root, with `requirements-dev.txt` installed:

```bash
python3 -m pytest -q
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

GitHub Actions runs CI (`.github/workflows/ci.yml`) on every push to `main` and every pull request into it. It needs no secrets.

1. **Frontend Lint**: ESLint and the type check (`npm run typecheck`).
2. **Frontend Unit Tests**: Vitest, with a coverage report.
3. **Frontend E2E Tests**: Playwright.
4. **Frontend Build**: the production build, including the prerendered heads.
5. **API Lint**: flake8, black and isort on `api/`.
6. **API Tests**: pytest.
7. **CI Success**: passes only when all of the above do.

**Post-deploy smoke** (`.github/workflows/smoke.yml`) checks each successful Vercel deployment: production, and previews when the `VERCEL_AUTOMATION_BYPASS_SECRET` secret is set (without it, a preview is skipped with a notice).

There is no manually-triggered deploy workflow. Vercel deploys directly from the Git integration.

## Production Deployment

Deployed on Vercel. Every push to `main` auto-deploys to https://www.crog.gg (the canonical host; the apex `crog.gg` 308s to it); every push to any branch gets a preview URL posted on the PR.

### Layout

- Frontend: `frontend/` → Vite build → `frontend/dist`, served as static assets by Vercel. The build writes one HTML file per route with that page's meta/OG tags (`frontend/scripts/vite-prerender.ts`), `vercel.json` serves them with `cleanUrls`, and anything else is a real 404 (`404.html`).
- Backend: `api/index.py` — Flask app deployed as a single Vercel Python Function under Fluid Compute. `vercel.json` rewrites `/api/(.*)` → `/api/index` so Flask handles all internal routing.
- Shared helpers: `api/_lib/`, one module per concern ([ARCHITECTURE](documentation/ARCHITECTURE.md#api)). The underscore prefix keeps Vercel from treating them as separate functions.
- Python deps: edit `requirements.in` (runtime) or `requirements-dev.in` (tools), then regenerate the hash-pinned `requirements.txt` and `requirements-dev.txt` with the `uv pip compile` command in each file's header. CI and local installs check the hashes. Vercel installs the same pinned versions, but its builder converts `requirements.txt` into a uv project and drops the hashes.

### Environment variables

Production's are set in the Vercel project's settings (`FLASK_DEBUG` is the one that's local only). This table is the list the other docs point to; local development needs none of them ([`.env.example`](.env.example) is the template).

| Var                                     | Required          | Notes                                                                                                                                                                                           |
| --------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                        | yes               | `/api/regenerate` won't work without it                                                                                                                                                         |
| `GITHUB_TOKEN`                          | yes (effectively) | required for `/api/v1/github/contributions` (GraphQL); bumps REST rate limits for the other GitHub endpoints. Use a token that can only read public data (CLAUDE.md has the settings) |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | recommended       | Auto-injected by the Upstash Marketplace integration. Without them `/api/regenerate` returns 503 (see Troubleshooting). If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set, the client reads them first. |
| `IP_HASH_SALT`                          | recommended       | A random secret (32+ characters) that keys the anonymous visitor tag used in rate-limit keys, log lines and `/api/regenerate`'s `safety_identifier`. Without it, keys and logs name visitors by address. Setting or changing it resets every visitor's rate-limit windows once. Set it for Production and Preview, with different values. |
| `FLASK_DEBUG`                           | local only        | `true` runs the local Flask server in debug mode and adds the Vite dev server's localhost origins to CORS. The Vite proxy makes local calls same-origin anyway. Never set it in Vercel.         |
| `VITE_API_URL`                          | leave empty       | If set to a non-empty value the frontend build will bake in that origin instead of calling same-origin `/api/*`                                                                                 |
| `VITE_SOURCE_REPO_URL`                  | optional          | The repo this site is built from. When set, the footer links to it as "view source"; left empty, there's no link. It's read at build time, so redeploy after changing it.                       |

### Bounding OpenAI spend

- Caps are charged before any OpenAI call, and without Redis the endpoint answers 503 rather than run unmetered ([ARCHITECTURE](documentation/ARCHITECTURE.md#apiregenerate-gate-by-gate), #113).
- The per-visitor cap (`REGEN_DAILY_MAX`) bounds one address; the site-wide cap (`REGEN_GLOBAL_DAILY_MAX`) bounds all of them together, so many addresses can't multiply the spend past it.
- Both caps live in this code and in Redis. Set a **monthly budget in the OpenAI billing dashboard**, and check that it stops requests rather than only alerting: it's the one limit outside this infrastructure, so it holds even if a cap is raised by mistake.
- Previews share production's Upstash database and OpenAI key, so a press on a preview spends production's site-wide daily slots (#139). If Preview uses Production's `IP_HASH_SALT` (or neither sets one), it also spends the presser's own daily slots and cooldown.

### Provisioning Upstash Redis

1. Vercel → project → **Storage** → **Create Database** → **Marketplace** → **Upstash for Redis**
2. Pick the free tier (or Pay As You Go with **Auto Upgrade off** to bound cost)
3. Region: us-east-1 (matches Vercel `iad1`)
4. Connect to the project, all 3 environments (Production / Preview / Development)
5. Redeploy so the function picks up the new env vars

### Web Analytics

Pageviews and the CTA events (`repo_click`, `quickstart_click`, `updates_click`) go to Vercel Web Analytics, through `frontend/src/services/analytics.ts`. It sets no cookies, its script and beacons are served from the site's own origin (`/_vercel/insights/*`), so the CSP needs no change, and a reported URL keeps its path and `utm_*` query parameters: no other parameter, and no fragment.

1. Vercel → project → **Analytics** → **Enable**, before the first deploy that ships `@vercel/analytics`. The `/_vercel/insights/*` routes exist from the next deployment on; until then every page requests a script that 404s.
2. Custom events need the **Pro** plan. On Hobby only pageviews are recorded, up to the plan's monthly event cap.

### Rollback

Vercel keeps every deployment. Roll back from the Deployments tab → ⋯ → Promote to Production on any prior build.

### Troubleshooting

| Symptom                                                                                | Likely cause                                                                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/regenerate` returns `"OpenAI API key not configured"`                            | `OPENAI_API_KEY` missing in Vercel env vars or last deploy predates the env var being set — set it and redeploy                         |
| `/api/v1/github/contributions` returns `"GitHub token required for contribution data"` | `GITHUB_TOKEN` missing — same fix                                                                                                       |
| `/api/regenerate` returns 503 `"Regeneration temporarily unavailable"`                 | Upstash env vars missing or DB not connected to the project. The paid endpoint fails closed on Redis errors (the GitHub endpoints' rate limiter fails open), so fix Upstash, not the endpoint |
| `/api/regenerate` returns 503 `"Daily regeneration budget reached"`                   | The site-wide daily ceiling (`REGEN_GLOBAL_DAILY_MAX` in `api/index.py`) is used up; each refusal logs `regenerate.global_cap_reached`. It frees up as the rolling 24 h window moves. Raise it only if the OpenAI budget allows |
| `/api/regenerate` failures with reason `model_error`                                    | The OpenAI key is invalid, or its quota or budget is used up. Check the OpenAI usage page.                                               |
| Project pages show "No README available" or no repo stats                              | A GitHub API error: `GITHUB_TOKEN` expired or rate-limited, or GitHub is down. The proxy answers 502, or 503 when GitHub rate-limits it, with "GitHub is unavailable right now", and logs `github upstream error`. |
| GitHub endpoints ignore rate limits                                                    | Upstash is unavailable. Their rate limiter fails open by design.                                                                  |
| `/api/v1/github/languages` returns 503 `"Language stats are unavailable right now"` | Upstash is unavailable. The aggregate refuses rather than fan out to GitHub uncached (#194 M33). |
| Frontend calls `https://api.crog.gg` instead of same-origin                            | `VITE_API_URL` in Vercel env vars points at the dead subdomain; clear it and redeploy                                                   |

## License

The code is released under the [MIT License](LICENSE). The personal content (bio, career history, photos and personal copy) isn't covered by it and stays all rights reserved; see [CONTENT-TERMS.md](CONTENT-TERMS.md). Third-party assets are credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
