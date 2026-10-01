> Historical snapshot (2026-07-02). Most findings have since been fixed; see GitHub issues, and #172 for the triage.

# System Review — Analysis Artifacts (2026-07-02)

This directory holds the durable, detailed analysis behind the triage tracker at
[`../../planning/tech-debt-triage_2026-07-02.md`](../../planning/tech-debt-triage_2026-07-02.md). The
tracker is the short, actionable checklist; these documents are the full
read-through that produced it, kept for provenance and future reference.

| Doc                                                            | Scope                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`01-frontend-architecture.md`](./01-frontend-architecture.md) | Component tree, routing, dead/duplicate code, the CustomEvent-vs-Zustand split, large components |
| [`02-data-services-hooks.md`](./02-data-services-hooks.md)     | YAML loaders, GitHub/logo services, hooks, the regeneration flow, code-quality signals           |
| [`03-testing-ci-config.md`](./03-testing-ci-config.md)         | Test coverage (FE + BE), CI, git hooks, build/tooling config, styling architecture, dependencies |

The issue drafts derived from these were removed in October 2026; see #119, #171 and #172.

## Provenance & caveats

- Generated 2026-07-02 from a full read-through of `api/`, `frontend/src/`,
  `.github/`, `.husky/`, and build/test config against `main`.
- Line references are as-of that date and will drift as fixes land; treat them as
  starting points, not guarantees.
- The highest-impact findings (BUG-1 route/data, BUG-2 pre-push path, BUG-3 vite
  copy plugin, BUG-6 project index) were independently verified against the code.
