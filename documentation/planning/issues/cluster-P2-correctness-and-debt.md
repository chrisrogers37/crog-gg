## P2 cluster — correctness, robustness & structural debt

Grouped P2 items from the 2026-07-02 system review. Each is a self-contained unit
of work; check off as they land. Full evidence in
`documentation/planning/tech-debt-triage_2026-07-02.md` and
`documentation/planning/reviews/`.

> Security note: **SEC-1** is grouped here as P2 per the tracker, but it is the
> highest-value item in this cluster — consider doing it first.

### Correctness / robustness bugs

- [ ] **SEC-1 — Harden `/api/regenerate` against abuse/cost.** Endpoint forwards
      arbitrary caller `content` into OpenAI and echoes parsed JSON, gated only by
      per-IP cooldown + daily cap. Cap request body / `content` length, validate
      `section` against the known set before doing work, consider a global daily
      budget. (`api/index.py:208-255`)
- [ ] **BUG-3 — Remove/repoint the broken `vite.config.ts` `copy-content`
      plugin.** It reads a non-existent `src/content` path with a stale hardcoded
      file list and swallows errors; Vite already copies `public/`.
      (`vite.config.ts:35-36,62-89,92-94`)
- [ ] **BUG-4 — Fix regeneration cooldown.** Await the result and start the client
      cooldown only on success; reconcile with `GET /api/limits` so the client timer
      can't desync from the server 429. (`useRegeneration.ts:23-29`, `useCooldown.ts:3`)
- [ ] **BUG-5 — Collapse the double `/api/regenerate` call.** One click fires two
      parallel POSTs, each consuming the daily quota; `.json()` runs without an
      `response.ok` check and partial success is discarded.
      (`contentStore.ts:148-174`)
- [ ] **BUG-6 — Reconcile project content sources.** `hedwig.yaml` exists on disk
      but is missing from `index.yaml`; the loader fallback list and vite copy list
      are separate stale enumerations. Pick one source of truth.
      (`public/content/projects/`, `projectLoader.ts:82-87`)
- [ ] **BUG-7 — Validate LLM output before storing.** Guard `content` shape
      (zod or manual) before committing to the store; fall back to prior state on
      mismatch. (`contentStore.ts:181-188`, backend only checks JSON parse at
      `api/index.py:260-272`)

### Structural / architectural debt

- [ ] **DEBT-1 — Delete dead components + their CSS.** `Portfolio.tsx`,
      `Skills.tsx`, `Typewriter.tsx`, `SectionTiles.tsx` (+ `SectionTiles.css` and the
      `.portfolio-section`/`.skills-container` rules in `App.css`).
- [ ] **DEBT-2 — Remove the `CustomEvent` bridge.** Make `About` render from the
      store (`useBio()`); delete `contentRegenerated` dispatch/listeners and the dead
      `contentUpdated` path. (`contentStore.ts:190-210,248-271`, `About.tsx:27-71`)
- [ ] **DEBT-3 — Resolve invisible regeneration.** Either wire regeneration to
      what's rendered (bio + timeline) or stop regenerating/loading the unused
      experience/education/skills slices (and unread `original*` state).
- [ ] **DEBT-4 — Delete orphaned modules & store API.** `sections/Experience`,
      `sections/Education`, `features/ContributionGraph`, `hooks/useScrollToSection`,
      `styles/tokens.ts`, `getRandomTransition`, stale `types/content.ts`, unused
      store selectors/actions.
- [ ] **DEBT-5 — Consolidate styling.** Pick one token source (Tailwind theme);
      delete `tokens.ts` and the transition rules duplicated between `App.css:716-753`
      and `transitions.css:7-36`; shrink `App.css`.
- [ ] **DEBT-6 — Extract a shared YAML loader with caching.** Replace the
      duplicated `fetch→text→yaml→as Type→log→throw` boilerplate with a
      `loadYaml<T>(path)` helper; add a cache / in-flight guard; standardize error
      behavior.

### Testing / CI

- [ ] **TEST-1 — Run Python tests in CI and cover the backend.** Add a `pytest`
      step; add unit tests for `rate_limit.py` (sliding window, cooldown TTL,
      fall-open) and the `/api/regenerate` gate. (`ci.yml:143-171`)
- [ ] **TEST-2 — Make CI format checks gate.** Drop the trailing `|| echo` from
      the black/isort steps so drift fails the build. (`ci.yml:167-171`)
- [ ] **TEST-3 — Test core frontend flows.** `contentStore`
      (load/regenerate/reset/error), the YAML loaders, and the cooldown/regeneration
      hooks.

## References

- Tracker: `documentation/planning/tech-debt-triage_2026-07-02.md`
- Analysis: `documentation/planning/reviews/`
