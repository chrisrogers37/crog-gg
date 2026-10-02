# Contributing

Thanks for looking. crog.gg is a personal site, so the bar for a change is that it makes the site better without making it harder to keep. Small fixes are welcome as they are; for anything bigger, open an issue first.

## Setup

The [README](README.md) has the two-process setup (`python3 -m api.index`, then `npm run dev` in `frontend/`). Nothing needs a secret to boot.

Run `npm install` once at the root of each checkout or worktree. It installs the git hooks: lint-staged before a commit, and the relevant half of CI's checks before a push.

## Before you open a PR

Run what CI runs. None of it needs a secret.

| Check | Command | From |
|---|---|---|
| Lint | `npm run lint` | `frontend/` |
| Type check (the app, the unit tests and e2e) | `npm run typecheck` | `frontend/` |
| Unit tests | `npm run test:run` | `frontend/` |
| E2E tests | `npm run test:e2e` | `frontend/` |
| Build, with the prerendered heads | `npm run build` | `frontend/` |
| API lint | `flake8 api --max-line-length=120 --ignore=E501,W503`, `black --check --line-length=120 api`, `isort --check-only --profile black api` | the repo root |
| API tests | `python3 -m pytest -q` | the repo root |

## Writing tests

- **E2E tests check structure and behaviour, not copy.** See "E2E Test Philosophy" in [CLAUDE.md](CLAUDE.md). Content that ships with the repo is never optional: a page rendering without it is a bug to fail on, not a reason to skip (#120).
- **Break the code a new test guards, and watch the test fail.** A test that passes either way checks nothing.

## Pressing SUMMON NEW LORE on a preview

Previews use production's Upstash counters and OpenAI key, so a press on a preview spends production's daily slots (#139). Tests stub `/api/regenerate`. Press for real sparingly.

## Linking issues from a PR (#169)

- **`Closes #N` only when the PR fully resolves #N.**
- **For partial work, use `Refs #N`, with no closing keyword in any arrangement, even a negated one.** "Nothing here closes #N" still contains the keyword. The rule is chosen so that no model of GitHub's parser is needed (PR #167 is the precedent).
- If a PR resolves one issue and advances another, use both forms, on separate lines.
- When a PR does partial work, open or update an issue that names what's left.

## Docs travel with the change

A PR that changes behaviour, an environment variable, a command or a limit also updates the docs that describe it: the README, CLAUDE.md or `documentation/`.

## Copy

Site copy follows CLAUDE.md's "Site copy style": plain on `/`, lowercase and casual on `/about`, and never an em dash.

## Security

Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes, not in a public issue.
