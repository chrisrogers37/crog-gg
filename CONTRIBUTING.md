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
| Unit tests (on `site.example`), and the site's own checks (on `site/`) | `npm run test:run` | `frontend/` |
| E2E tests, on both sites | `npm run test:e2e`, then `SITE_DIR=site.example npm run test:e2e` | `frontend/` |
| Build, with the prerendered heads, and the fixture's check and build | `npm run build`, then `SITE_DIR=site.example npm run site:check && SITE_DIR=site.example npm run build` | `frontend/` |
| API lint | `flake8 api --max-line-length=120 --ignore=E501,W503`, `black --check --line-length=120 api`, `isort --check-only --profile black api` | the repo root |
| API tests | `python3 -m pytest -q` | the repo root |

## Writing tests

- **E2E tests check structure and behaviour, not copy.** See "E2E Test Philosophy" in [CLAUDE.md](CLAUDE.md).
- **No test pins the owner's content (#191).** Unit tests read `site.example/`, a fictional site, through `virtual:site-config` and `@site/`. The rules the owner's own content must meet are `src/site-check/`'s, and they run against the active site. E2E reads the active site's tabs and home from `e2e/site.ts`. So a fork's edits to `site/` can't turn a test red unless they break something.
- **Break the code a new test guards, and watch the test fail.** A test that passes either way checks nothing.

## Pressing SUMMON NEW LORE on a preview

A press on a preview spends production's site-wide daily slots ([why](README.md#bounding-openai-spend), #139). Tests stub `/api/regenerate`; press for real sparingly.

## Linking issues from a PR (#169)

- **`Closes #N` only when the PR fully resolves #N.**
- **For partial work, use `Refs #N`, with no closing keyword in any arrangement, even a negated one.** "Nothing here closes #N" still contains the keyword. (Then nobody has to predict GitHub's parser; PR #167 is the precedent.)
- If a PR resolves one issue and advances another, use both forms, on separate lines.
- When a PR does partial work, open or update an issue that names what's left.

## Docs travel with the change

A PR that changes behaviour, an environment variable, a command or a limit also updates the doc that owns the fact, in the same PR. Each fact has one owner, and the other docs link to it:

| Fact | Owner |
|---|---|
| The checks CI runs | the table above (`.github/workflows/ci.yml` is the executable truth) |
| CI's jobs | the README's [CI/CD](README.md#cicd) |
| Environment variables | the README's [table](README.md#environment-variables) |
| `/api/regenerate`'s gates, the fail-closed contract and the GitHub proxy | [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) |
| Spend advice | the README's [Bounding OpenAI spend](README.md#bounding-openai-spend) |
| Content fields and their gotchas | [documentation/CONTENT.md](documentation/CONTENT.md) |
| Analytics events | the README's [Web Analytics](README.md#web-analytics) |

Add a line to [CHANGELOG.md](CHANGELOG.md) for anything a visitor or a forker would notice.

## Copy

Site copy follows CLAUDE.md's "Site copy style": plain on `/`, lowercase and casual on `/about`, and never an em dash.

## Security

Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes, not in a public issue.
