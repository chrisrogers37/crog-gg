# Vercel Migration — Overview

**Created:** 2026-05-17
**Goal:** Migrate crog.gg fully to Vercel (frontend + backend) for platform consolidation.
**Current state:** Site is offline. Repo is `chrisrogers37/crog-gg`. Main is on pre-Halo "more me" version (`7f3e5fd`). Halo redesign preserved on `origin/halo-redesign` for separate iteration.

## Decision: Full Vercel

Chris uses Vercel for everything else. Consolidation is the explicit goal — one platform for billing, env vars, DNS, monitoring, deploy previews. Hybrid options (frontend Vercel + Flask on Render/Fly.io) and going back to DO were considered and rejected because they leave a second platform in play.

Trade-off: site stays offline ~1–2 focused work sessions while we port the Flask backend properly. No interim "stopgap" deploy — going straight to the final state.

## What gets ported

### Frontend (trivial)

- `/frontend` — React 18 + Vite + TypeScript → static build, native Vercel fit.
- Set `VITE_API_URL` to same-origin (Vercel functions deploy under the same domain).

### Backend — port from Flask to Vercel Python functions

- `backend/app.py` (704 LOC monolith, 7 routes) → per-file functions under `api/`:
  - `api/regenerate.py` — POST, OpenAI proxy with cooldown
  - `api/limits.py` — GET, cooldown status
  - `api/v1/github/repo/[name].py` — GET repo metadata
  - `api/v1/github/readme/[name].py` — GET README content
  - `api/v1/github/languages/[name].py` — GET per-repo language stats
  - `api/v1/github/languages.py` — GET aggregated language stats
  - `api/v1/github/contributions.py` — GET GraphQL contribution calendar
- Each function uses Python runtime (`@vercel/python`).
- `vercel.json` declares Python runtime + any route rewrites.

### State migration (the hard part)

Two pieces of in-process state in current Flask app must move to durable storage:

1. **Flask-Limiter `memory://` storage** (rate limits per IP for GitHub endpoints)
2. **`_regeneration_cooldowns` dict** (30s per-IP cooldown on `/api/regenerate`)

Replace both with **Upstash Redis** (provisioned via Vercel Marketplace, free tier). Single shared Redis client across functions. Roll our own sliding-window rate limiter (~20 lines) — small enough that adding a Python dependency is overkill.

### Headers / IP detection

On DO with gunicorn, `get_remote_address()` worked directly. On Vercel, the client IP is in `x-real-ip` (Vercel sets it from the trusted edge). This actually **resolves issue #77** (X-Forwarded-For spoofing) for free — we read `x-real-ip` which is set by Vercel's edge after stripping client-supplied headers.

## External services

- **Upstash Redis** — provisioned via Vercel Marketplace integration. Auto-sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars in Vercel.
- **OpenAI** — `OPENAI_API_KEY` env var, set manually in Vercel project settings.
- **GitHub** — `GITHUB_TOKEN` env var (optional, raises rate limits), set manually.

## Security work bundled into this migration

Issues #76–79 must be addressed. Notes on how Vercel changes the shape of each:

| #   | Issue                                                 | Vercel impact                                                                                                |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| #76 | Unauthenticated `/api/regenerate` (OpenAI bill abuse) | Still applies. Add CAPTCHA or shared-secret header check in the function.                                    |
| #77 | X-Forwarded-For spoofing → rate-limit bypass          | **Fixed by platform** — use `x-real-ip` on Vercel. Still need to wire it correctly in the function.          |
| #78 | npm CVEs (Vite, picomatch, postcss)                   | Same fix — `npm audit fix` in `/frontend`. Vercel build will fail if `npm install` breaks, so do this early. |
| #79 | Verbose errors, rehype-raw XSS, CORS, systemd         | Verbose errors + rehype-raw + CORS still apply. **Systemd item is N/A** (no systemd on Vercel).              |

## Phases

| #   | Phase                                                                | Time  | Notes                                                                                  |
| --- | -------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| 01  | Security fixes on current Flask code (#76–79)                        | 2h    | Cleaner to fix in the monolith first, then port                                        |
| 02  | Provision Upstash Redis via Vercel Marketplace                       | 15min | One click, auto env vars                                                               |
| 03  | Port `backend/app.py` to `api/*.py` functions                        | 3h    | Endpoint-by-endpoint, shared `_lib/` helpers (redis, github headers, error formatting) |
| 04  | Add `vercel.json`, configure project, test locally with `vercel dev` | 45min |                                                                                        |
| 05  | Frontend on Vercel (point `VITE_API_URL` to same origin)             | 30min |                                                                                        |
| 06  | Deploy to preview, verify all 7 endpoints + frontend flow            | 45min |                                                                                        |
| 07  | DNS cutover (crog.gg → Vercel)                                       | 30min | Low TTL ahead of time if possible                                                      |
| 08  | Decommission `.github/workflows/deploy.yml` SSH-to-DO workflow       | 15min |                                                                                        |

Total: ~8h of focused work, realistic to ship over 1–2 sessions.

## Out of scope

- Halo redesign (lives on `origin/halo-redesign`, iterated separately with Vercel preview deploys)
- New features (Cortana assistant, /claudfather sub-pages from issue #63)
- Visual / content updates

## Rollback

- Vercel keeps every deployment, instant rollback in dashboard.
- DNS: keep TTLs low ahead of cutover; reverting to old DO IP not useful since the droplet is gone, but we can leave the site offline rather than ship a broken state.
- Code: `7f3e5fd` (pre-Halo, current main) is the baseline. Halo branch is preserved.

## Open questions

- Do you want the `npm` package name renamed from `choose-your-own-chris` to `crog-gg`? (Cosmetic, doesn't block.)
- CAPTCHA provider for #76 — hCaptcha (no Vercel-native option) or shared-secret header from frontend (simpler, less secure)?
