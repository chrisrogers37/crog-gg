## Summary

The `pre-push` git hook still targets a `backend/` directory that no longer exists
(the backend was ported to `api/`). As a result, Python changes are never linted
or format-checked locally before a push, and the "run everything" fallback tries
to `cd backend` into a missing directory.

## Root cause

```sh
# .husky/pre-push:43-45
if echo "$CHANGED_FILES" | grep -q "^backend/"; then
  BACKEND_CHANGED=true
fi
```

```sh
# .husky/pre-push:104
    if (cd backend && flake8 --max-line-length 120 --exclude venv .); then
```

Consequences:

- Edits under `api/` never set `BACKEND_CHANGED`, so flake8/black/isort never run.
- When change detection fails, the fallback sets `BACKEND_CHANGED=true` and then
  runs `cd backend` against a nonexistent path (`:48-51`).
- Missing tools only print a message and still allow the push (`:99-101`).

## Fix direction

- Replace `^backend/` with `^api/` and `cd backend` with the correct location
  (repo root, targeting `api`).
- Align commands/exclusions with CI (`.github/workflows/ci.yml:143-171`):
  `flake8 api --max-line-length=120 --ignore=E501,W503`,
  `black --check --line-length=120 api`, `isort --check-only --profile black api`.
- Consider failing (not just warning) when the tools are missing, or documenting
  that backend checks require `pip install flake8 black isort`.

## Acceptance criteria

- Editing a file under `api/` triggers backend lint/format checks on push.
- The hook no longer references `backend/`.
- Hook behavior matches CI so a clean local push implies a clean CI API-lint job.

## References

- Tracker: `documentation/planning/tech-debt-triage_2026-07-02.md` — BUG-2
- Analysis: `documentation/planning/reviews/03-testing-ci-config.md` §3
