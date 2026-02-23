# Phase 01: Harden Flask Backend - Disable Debug Mode and Sanitize Logging

**Status:** 🔧 IN PROGRESS
**Started:** 2026-02-22

| Field              | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **PR Title**       | fix(security): disable debug mode and sanitize verbose logging in Flask backend |
| **Risk Level**     | Low                                                                             |
| **Effort**         | Low (~30 minutes)                                                               |
| **Files Modified** | 1 (`backend/app.py`)                                                            |
| **Files Created**  | 0                                                                               |
| **Dependencies**   | None                                                                            |
| **Unlocks**        | None                                                                            |

---

## Context

This phase addresses four HIGH-severity findings from the security audit (2026-02-22). The Flask backend (`backend/app.py`) has two classes of issues:

1. **Debug mode enabled in the development entry point** (Finding #1). Line 577 runs `app.run(debug=True, port=5001)`. While production uses Gunicorn (which bypasses `__main__`), if anyone runs `python app.py` directly on the server, Flask's debug mode enables the interactive debugger and reloader - both of which allow arbitrary code execution via the Werkzeug debugger console.

2. **Verbose logging of sensitive data** (Findings #2, #3, #4). Multiple `logger.info()` calls unconditionally log request headers (including `Authorization`), raw request bodies (containing user content), and full OpenAI API messages (including system prompts). These logs persist in server log files and are visible to anyone with log access. In production, the logging level is INFO, so all of these fire on every single request.

The fix is straightforward: disable debug mode by default and gate all verbose/sensitive logging behind `logger.debug()` so it only appears when the log level is explicitly lowered to DEBUG (which should never happen in production).

---

## Dependencies

- **Requires**: Nothing. This phase is fully independent.
- **Unlocks**: Nothing. All other security audit phases are independent.
- **Parallel-safe**: Yes. This phase only modifies `backend/app.py`. No other phase in the security audit touches this file except Phase 05 (validation/rate limiting), which modifies non-overlapping sections.

---

## Detailed Implementation Plan

All changes are in a single file: `backend/app.py`.

### Step 1: Add `FLASK_DEBUG` environment variable check

After line 26 (`load_dotenv()`), insert:

```python

# Debug mode flag: controls verbose logging and Flask debug mode.
# Set FLASK_DEBUG=true in .env or environment for local development only.
_flask_debug = os.getenv('FLASK_DEBUG', 'false').lower() in ('true', '1', 'yes')
if _flask_debug:
    logger.setLevel(logging.DEBUG)
```

**Why this ordering**: `load_dotenv()` must run first so that `FLASK_DEBUG` can be read from the `.env` file during local development.

### Step 2: Change sensitive `logger.info()` calls to `logger.debug()`

| Line | Current                                                                     | New                 | Finding |
| ---- | --------------------------------------------------------------------------- | ------------------- | ------- |
| 133  | `logger.info(f"Request Headers: {dict(request.headers)}")`                  | `logger.debug(...)` | #2      |
| 136  | `logger.info(f"Raw request data: {json.dumps(data, indent=2)}")`            | `logger.debug(...)` | #3      |
| 155  | `logger.info(f"Content to regenerate: {json.dumps(content, indent=2)}")`    | `logger.debug(...)` | Related |
| 243  | `logger.info(f"Using prompt: {json.dumps(section_prompt, indent=2)}")`      | `logger.debug(...)` | Related |
| 252  | `logger.info(f"OpenAI request messages: {json.dumps(messages, indent=2)}")` | `logger.debug(...)` | #4      |
| 261  | `logger.info(f"Raw OpenAI response: {response}")`                           | `logger.debug(...)` | Related |
| 265  | `logger.info(f"Generated content: {new_content}")`                          | `logger.debug(...)` | Related |

**Lines intentionally left as `logger.info()`** - these are safe operational logs:

- Line 119: `"=== New Regenerate Request ==="` (no sensitive data)
- Line 125: Rate limit message with IP (acceptable for ops monitoring)
- Lines 151-154: Section name, boolean flags (no sensitive data)
- Line 246: `"Making OpenAI API request..."` (no data)
- Line 260: `"OpenAI API response received successfully"` (no data)

### Step 3: Disable debug mode in `__main__` block (Finding #1)

**Before (line 577):**

```python
    app.run(debug=True, port=5001)
```

**After:**

```python
    app.run(debug=_flask_debug, port=5001)
```

---

## Test Plan

### Manual Verification Steps

1. **Verify default behavior (no FLASK_DEBUG set):**

   ```bash
   cd backend && source venv/bin/activate
   unset FLASK_DEBUG
   python app.py
   ```

   - Confirm Flask starts WITHOUT the interactive debugger
   - Send a test request and confirm logs do NOT show headers, body, or OpenAI messages

2. **Verify debug behavior (FLASK_DEBUG=true):**

   ```bash
   FLASK_DEBUG=true python app.py
   ```

   - Confirm verbose debug lines now appear

3. **Verify Gunicorn behavior is unchanged:**

   ```bash
   gunicorn app:app --bind 0.0.0.0:5001 --workers 1
   ```

   - The `__main__` block is not executed under Gunicorn

### CI Verification

```bash
cd backend && source venv/bin/activate
flake8 app.py --max-line-length=120 --ignore=E501,W503
black --check --line-length=120 app.py
isort --check-only --profile black app.py
```

---

## Documentation Updates

No changes needed to CLAUDE.md. The new `FLASK_DEBUG` env var should be documented in Phase 03 (`.env.example` files).

---

## Stress Testing & Edge Cases

- **`FLASK_DEBUG` set to unexpected values**: The check handles common truthy values. Any other value defaults to `False`.
- **`FLASK_DEBUG` not set at all**: Defaults to `'false'` -> `False`. Safe.
- **Gunicorn log level override**: App logger level is controlled independently by `_flask_debug`. Correct behavior.
- **Performance**: Changing to `logger.debug()` with INFO level means the framework short-circuits before formatting. Micro-optimization.

---

## Verification Checklist

- [ ] `_flask_debug` variable is defined after `load_dotenv()`
- [ ] `_flask_debug` defaults to `False` when `FLASK_DEBUG` is not set
- [ ] `logger.setLevel(logging.DEBUG)` only called when `_flask_debug` is `True`
- [ ] Lines 133, 136, 155, 243, 252, 261, 265: `logger.info` changed to `logger.debug`
- [ ] Line 577: `debug=True` changed to `debug=_flask_debug`
- [ ] Operational `logger.info()` calls (119, 125, 151-154, 229, 246, 260, 270) are NOT changed
- [ ] Linting passes (flake8, black, isort)
- [ ] Manual test confirms no sensitive data in logs without `FLASK_DEBUG`

---

## What NOT To Do

1. **Do NOT remove the logging statements entirely.** They are valuable for debugging. Gate them behind `logger.debug()`.
2. **Do NOT use `app.debug` or `app.config['DEBUG']` as the gate.** Use a separate env var to avoid Flask side effects.
3. **Do NOT hardcode `debug=False`.** Use `debug=_flask_debug` for configurability.
4. **Do NOT add header filtering/redaction logic.** Changing to `logger.debug()` is simpler and achieves the same goal.
5. **Do NOT change `logger.error()` calls.** Error logging is critical for production monitoring.
6. **Do NOT set `FLASK_DEBUG=true` in the production `.env` file.**

---

_Remediation doc for Security Audit 2026-02-22, Phase 01. Addresses findings #1, #2, #3, #4._
