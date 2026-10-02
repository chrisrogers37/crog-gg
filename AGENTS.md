# AGENTS.md

Project guidance lives in `CLAUDE.md` (architecture, commands, conventions, design system). Read it first: it points to the doc that owns each topic, such as [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) for the API and [documentation/CONTENT.md](documentation/CONTENT.md) for the content files. This file adds what any coding agent needs to run the project, then the notes that apply only on Cursor Cloud.

## Running the project

This is crog.gg: a Vite/React frontend in `frontend/` and a Flask backend in `api/` (deployed as one Vercel Python function). Dev runs as two local processes.

### Services and how to run them

- Frontend (Vite dev server, port 5173): `cd frontend && npm run dev`. `/` renders from `frontend/src/content/claudlobby.ts` and the portfolio from the YAML in `frontend/public/content/`, so the site works with no backend or secrets; only SUMMON NEW LORE and the GitHub panels need the backend.
- Backend (Flask, port 5001): from the repo root, `python3 -m api.index`. `python api/index.py` fails with `ModuleNotFoundError: No module named 'api'`: run as a file, the repo root isn't on `sys.path`.
- The Vite dev server proxies `/api/*` to the backend on `:5001` (see `frontend/vite.config.ts`), so the frontend calls same-origin `/api`: leave `VITE_API_URL` unset.

### Secrets (none required to boot)

The README's [environment variables table](README.md#environment-variables) lists them, and `.env.example` is a template. Without `OPENAI_API_KEY`, `/api/regenerate` answers 500; with a key but no Upstash, it answers 503, because the paid endpoint fails closed (#113). Without `GITHUB_TOKEN` the GitHub panels degrade. The rest of the site (the sections, the projects, search and filter) works either way.

### Lint / test / build

Run every row of the table in [CONTRIBUTING.md](CONTRIBUTING.md#before-you-open-a-pr): the frontend's from `frontend/`, the API's from the repo root (`conftest.py` puts the root on `sys.path` and stubs Redis). `npm run test:e2e` starts its own servers.

## On Cursor Cloud

- The repo is at `/workspace`.
- Backend Python tooling installs to `~/.local/bin` (added to PATH via `~/.bashrc`). Invoking it as `python3 -m <tool>` also works, whatever the PATH.
