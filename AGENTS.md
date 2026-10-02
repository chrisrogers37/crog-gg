# AGENTS.md

Project guidance lives in `CLAUDE.md` (architecture, commands, conventions, design system). Read it first. This file adds what any coding agent needs to run the project, then the notes that apply only on Cursor Cloud.

## Running the project

This is a single-product site (`crog.gg`): a Vite/React frontend in `frontend/` and a Flask backend in `api/` (deployed as one Vercel Python function). Dev runs as two local processes.

### Services and how to run them

- Frontend (Vite dev server, port 5173): `cd frontend && npm run dev`. The site renders from the YAML in `frontend/public/content/`, so it works with no backend or secrets; only SUMMON NEW LORE and the GitHub panels need the backend.
- Backend (Flask, port 5001): run it as a module from the repo root, `python3 -m api.index`. Do NOT run `python api/index.py`: `api/index.py` uses absolute imports like `from api._lib import ...` and there is no `api/__init__.py`, so running the file directly fails with `ModuleNotFoundError: No module named 'api'`. Running it with `-m` from the repo root puts the root on `sys.path` and resolves the namespace package.
- The Vite dev server proxies `/api/*` to the backend on `:5001` (see `frontend/vite.config.ts`), so the frontend calls same-origin `/api`: leave `VITE_API_URL` unset. Set `FLASK_DEBUG=true` when you need the backend's localhost CORS allow-list, though the Vite proxy makes requests same-origin anyway.

### Optional secrets (none required to boot)

`OPENAI_API_KEY` (powers `POST /api/regenerate`), `GITHUB_TOKEN` (powers `/api/v1/github/contributions` + higher REST limits), and `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Upstash rate limiting) are all optional; `.env.example` describes each one. Without them `/api/regenerate` returns 503 (the paid endpoint fails closed without Upstash, see #113) and the GitHub panels degrade, but the core portfolio (browse sections, projects, search/filter) still works.

### Lint / test / build (see `CLAUDE.md` and `.github/workflows/ci.yml` for exact commands)

- Frontend, in `frontend/`: `npm run lint`, `npm run typecheck`, `npm run test:run` (Vitest), `npm run test:e2e` (Playwright, starts its own servers), `npm run build`.
- API, from the repo root: tests are `python3 -m pytest -q` (`conftest.py` puts the repo root on `sys.path` and stubs Redis). Lint: `flake8 api --max-line-length=120 --ignore=E501,W503`, `black --check --line-length=120 api`, `isort --check-only --profile black api`.

## On Cursor Cloud

- The repo is at `/workspace`.
- Backend Python tooling installs to `~/.local/bin` (added to PATH via `~/.bashrc`). Invoking it as `python3 -m <tool>` also works, whatever the PATH.
