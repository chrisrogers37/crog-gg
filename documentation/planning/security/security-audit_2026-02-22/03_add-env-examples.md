# Phase 03: Add .env.example Documentation Files

**Status:** ✅ COMPLETE
**Started:** 2026-02-22
**Completed:** 2026-02-22

| Field                  | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| **PR Title**           | Add .env.example documentation files for frontend and backend |
| **Risk**               | Low                                                           |
| **Effort**             | Low (~15 minutes)                                             |
| **Findings Addressed** | #7 (MEDIUM)                                                   |
| **Files Created**      | `frontend/.env.example`, `backend/.env.example`               |
| **Files Modified**     | None                                                          |
| **Dependencies**       | None                                                          |
| **Unlocks**            | None                                                          |

---

## Context

**Finding #7 (MEDIUM - Env hygiene):** No `.env.example` files exist anywhere in the project. Developers cannot determine which environment variables are needed without reading source code or asking another developer.

The project uses environment variables in two places:

1. **Frontend (Vite):** `VITE_API_URL` consumed via `import.meta.env.VITE_API_URL` in `githubService.ts:1` and `contentStore.ts:80`
2. **Backend (Flask):** `OPENAI_API_KEY` (required, `app.py:44`) and `GITHUB_TOKEN` (optional, `app.py:51`)

The root `.gitignore` already has `!.env.example` on line 48, ensuring `.env.example` files are tracked by git.

---

## Dependencies

- **Depends on:** None.
- **Unlocks:** None.
- **Parallel safe:** Yes - creates new files that no other phase touches.

---

## Detailed Implementation Plan

### Step 1: Create `frontend/.env.example`

Create a new file at `frontend/.env.example` with this exact content:

```
# Backend API URL
# Development: point to local Flask server
# Production: https://api.crog.gg (set in .env.production)
VITE_API_URL=http://localhost:5001
```

### Step 2: Create `backend/.env.example`

Create a new file at `backend/.env.example` with this exact content:

```
# OpenAI API key (required)
# Get one at: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key-here

# GitHub personal access token (optional)
# Provides higher API rate limits for GitHub endpoints
# Create one at: https://github.com/settings/tokens
# Required scopes: public_repo (read-only access to public repositories)
GITHUB_TOKEN=your-github-token-here

# Enable debug mode (optional, default: false)
# Enables Flask debug mode and verbose logging of requests/responses
# FLASK_DEBUG=true
```

### Step 3: Do NOT create a root `.env.example`

The root `.env` is redundant - frontend and backend each load their own `.env` independently. A root `.env.example` would cause confusion.

---

## Test Plan

### No automated tests needed

This is a documentation-only change.

### Manual Verification Steps

1. **Verify files are tracked by git:**

   ```bash
   git add frontend/.env.example backend/.env.example
   git status
   ```

   Both files should appear as "new file" (the `!.env.example` gitignore pattern ensures they're not ignored).

2. **Verify no secrets are committed:**
   ```bash
   git diff --cached frontend/.env.example backend/.env.example
   ```
   Confirm only placeholder values like `your-openai-api-key-here`.

---

## Verification Checklist

- [ ] `frontend/.env.example` exists with `VITE_API_URL=http://localhost:5001`
- [ ] `backend/.env.example` exists with placeholder values for `OPENAI_API_KEY` and `GITHUB_TOKEN`
- [ ] Neither `.env.example` file contains real API keys or secrets
- [ ] Both files are tracked by git (not ignored by `.gitignore`)
- [ ] No root-level `.env.example` was created

---

## What NOT To Do

1. **Do NOT put real API keys in `.env.example` files.** Use placeholders only.
2. **Do NOT create a root `.env.example`.** Frontend and backend load their own `.env` independently.
3. **Do NOT add `NODE_ENV`, `FLASK_ENV`, or `PORT`.** These are not used via `os.getenv()` or `import.meta.env` in the codebase currently.
4. **Do NOT modify existing `.env` files.** They are gitignored and contain real secrets.
5. **Do NOT add the production API URL to `frontend/.env.example`.** Production values are in `.env.production`.
6. **Do NOT modify `.gitignore`.** It already has `!.env.example` on line 48.

---

_Remediation doc for Security Audit 2026-02-22, Phase 03. Addresses finding #7._
