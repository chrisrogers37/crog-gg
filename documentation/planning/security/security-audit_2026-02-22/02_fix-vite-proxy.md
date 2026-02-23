# Phase 02: Fix Vite Dev Proxy Configuration

**Status:** ✅ COMPLETE
**Started:** 2026-02-22
**Completed:** 2026-02-22

| Field                  | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **PR Title**           | fix: correct Vite dev proxy port and remove unnecessary secure flag |
| **Risk**               | Low                                                                 |
| **Effort**             | Low (~15 minutes)                                                   |
| **Files Modified**     | 2 (`frontend/vite.config.ts`, `CLAUDE.md`)                          |
| **Files Created**      | 0                                                                   |
| **Findings Addressed** | #5 (MEDIUM - TLS verification disabled), #6 (MEDIUM - stale port)   |

---

## Context

The Vite development server proxy in `frontend/vite.config.ts` has two configuration issues:

1. **Stale port (Finding #6):** The proxy targets `http://localhost:5000` but the Flask backend runs on port 5001 (confirmed at `backend/app.py:577`). The `.env` file currently has `VITE_API_URL=http://localhost:5001`, which bypasses the proxy entirely - so the proxy is effectively dead code right now. Fixing the port makes the proxy functional as a fallback.

2. **`secure: false` (Finding #5):** The proxy disables TLS certificate verification. While the target uses `http://` making the flag inoperative, leaving `secure: false` is a footgun if someone changes the target to `https://` in the future. Removing it sets the correct default.

These fixes are dev-only configuration changes with zero impact on production builds.

---

## Dependencies

- **Depends on:** None.
- **Unlocks:** None.
- **Parallel safety:** Modifies only `frontend/vite.config.ts` (lines 99-123) and `CLAUDE.md` (line 98). No other phase touches these.

---

## Detailed Implementation Plan

### Step 1: Fix the proxy target port and remove `secure: false`

**File:** `frontend/vite.config.ts`

**Before (lines 99-121):**

```typescript
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
```

**After:**

```typescript
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
```

Two changes: line 102 target port 5000 -> 5001, and line 104 (`secure: false,`) deleted entirely.

### Step 2: Update CLAUDE.md workaround note

**File:** `CLAUDE.md`, line 98

**Before:**

```markdown
- **Note**: Vite dev proxy in `vite.config.ts` targets port 5000 (stale) — use `VITE_API_URL=http://localhost:5001` instead
```

**After:**

```markdown
- Vite dev proxy in `vite.config.ts` forwards `/api` requests to `http://localhost:5001`
```

---

## Test Plan

### Manual Verification Steps

1. **Build passes:** `cd frontend && npm run build`
2. **Lint passes:** `cd frontend && npm run lint`
3. **Proxy works with backend:**
   - Start Flask: `cd backend && source venv/bin/activate && python app.py`
   - Temporarily rename `frontend/.env` to `.env.bak` (forces proxy usage)
   - Start Vite: `cd frontend && npm run dev`
   - Visit `http://localhost:5173`, check Network tab for proxied `/api/*` requests
   - Restore `.env` after testing

---

## Verification Checklist

- [ ] `vite.config.ts` line 102 reads `target: "http://localhost:5001"`
- [ ] `vite.config.ts` does NOT contain `secure: false`
- [ ] `vite.config.ts` still has `changeOrigin: true` and `ws: true`
- [ ] `CLAUDE.md` line 98 no longer mentions "stale" or "port 5000"
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] Git diff shows exactly 2 files changed

---

## What NOT To Do

1. **Do NOT change target to `https://localhost:5001`.** Flask dev server runs plain HTTP.
2. **Do NOT add `secure: true` explicitly.** Just delete the line. `true` is the default.
3. **Do NOT remove `changeOrigin: true`.** Needed for Host header rewriting.
4. **Do NOT remove the `configure` callback.** The proxy event handlers provide useful dev debugging.
5. **Do NOT modify `.env` or `.env.production`.** They are correct as-is.
6. **Do NOT update archived docs.** `documentation/archive/09-technical-specifications.md` references port 5000 but archives are historical snapshots.
7. **Do NOT add `rewrite` rules.** The `/api` prefix should forward as-is to the backend.

---

_Remediation doc for Security Audit 2026-02-22, Phase 02. Addresses findings #5 and #6._
