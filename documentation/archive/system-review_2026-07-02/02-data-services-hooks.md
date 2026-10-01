> Historical snapshot (2026-07-02). Most findings have since been fixed; see GitHub issues, and #172 for the triage.

# Data Layer, Services & Hooks Review — 2026-07-02

Architecture:

```
useContentLoader → contentStore.loadContent → loadResumeData → *Loader.ts → fetch /content/*.yaml → js-yaml + `as Type`
                                             → loadTimeline
ImageShowcase → loadShowcase → (separate fetch path)
useRegeneration → contentStore.regenerateContent → POST /api/regenerate x2
```

## 1. YAML loaders (`utils/*Loader.ts`)

**Duplicated fetch/parse boilerplate.** `bioLoader.ts:4-19`,
`experienceLoader.ts:4-21`, `educationLoader.ts:4-19`, `skillsLoader.ts:4-19` are
near-identical (`fetch` → `text()` → `yaml.load()` → `as Type` → log → rethrow).
`projectLoader.ts:49-72` duplicates its `RawProjectData → Project` mapping in both
the index and fallback branches (`:100-123`).

**Hardcoded paths.** Every loader hardcodes `/content/...` (bio `:7`, experience
`:7`, education `:7`, skills `:7`, timeline `:6`, showcase `:14`, projects
`:32,42`).

**Stale project fallback list.** `projectLoader.ts:82-87` lists `shuffify`,
`city-cycles`, `hedwig`, `github` — out of sync with `index.yaml` (which has 8
projects incl. `benzo`, `storyline-ai`, `dead-redux`, `shitpost-alpha`,
`30-day-abs`, and does **not** list `hedwig`). See BUG-6.

**Type-unsafe parsing.** All loaders use `yaml.load(...) as Type` with no runtime
validation. `resume.ts:38-40` assumes `.experience`/`.education`/`.skills` exist;
`projectLoader.ts:37` casts the index to `{ projects: string[] }` with no guard —
missing keys throw at runtime.

**Inconsistent error handling.** bio/exp/edu/skills throw; `showcaseLoader.ts:21-23`
and `timelineLoader.ts:13-16` swallow and return empties; `projectLoader` index
path fails whole load on one bad file, fallback path returns `null` per file.

**No caching / refetch every call.** No module- or store-level cache;
`loadContent()`/`resetContent()` refetch all YAML; `ImageShowcase.tsx:15-18`
fetches independently; `loadContent` has no in-flight dedup; StrictMode
double-invokes in dev.

**Type duplication.** `showcaseLoader.ts:3-10` re-defines `ShowcaseImage`/
`ShowcaseData` that already exist in `types/Showcase.ts`.

## 2. Services

### `githubService.ts`

- Base `VITE_API_URL`, defaults to same-origin — good pattern (`:1,70`).
- In-memory 5-min cache (`:66-90`) — but no retry, and **failures aren't cached**
  (repeated errors hammer backend). Cache read is unchecked `cached.data as T`.
- Only checks `response.ok`; ignores `{ error: "..." }` JSON bodies (`:101-175`).
- `getReadme` does `atob(data.content...)` with no validation (`:125-127`).
- No runtime schema validation on responses.
- `GitHubReadme.tsx:80,114` hardcodes username `chrisrogers37` (duplicates backend
  `request_utils.py:9`).
- Correctly proxies via `/api/v1/github/*` — no duplicated GitHub API logic.

### `logoService.ts`

- Hardcoded Clearbit + Google favicon URLs (`:12-15`).
- Validation cache keyed by URL — good dedup (`:29,44-56`).
- `Image()` load check has **no timeout** — hung requests never resolve (`:48-52`).
- Silent `null` on failure.

## 3. Hooks

### `useContentLoader.ts`

- Calls `loadContent()` on every mount, no guard (`:21-23`); only wired in
  `HomePage.tsx:66`. `ProjectsPage`/`ProjectDetailPage` never call it → infinite
  skeleton / false "Project Not Found" on direct navigation. **See BUG-1.**

### `useCooldown.ts`

- `COOLDOWN_DURATION = 30` hardcoded client-side (`:3`); never calls
  `GET /api/limits` (`api/index.py:284-294`), so client can desync from server 429. Minor: `setTimeout(...,1500)` inside interval not cleared on unmount
  (`:43`). 100ms poll is intentional for the sweep animation.

### `useRegeneration.ts`

- Fires fire-and-forget `regenerateContent()` (not awaited) then unconditionally
  `startCooldown()` (`:23-29`) — cooldown starts even on early-return/failure.
  **See BUG-4.**

### `useLogo.ts`

- Has a cancellation flag (good) but doesn't reset `logoUrl` to `null` when
  `domain` changes (stale logo shown), and no `.catch()` on the promise.

### `useScrollToSection.ts`

- Exported but never used — dead code (`:21-37`).

## 4. Regeneration flow

Call path: `HomePage.tsx:306` → `useRegeneration` → `contentStore.regenerateContent`
→ two **parallel** `POST /api/regenerate` (`about` + `portfolio`,
`contentStore.ts:149-171`) → `Promise.all` → `.json()` (no `response.ok` check).
Backend returns `{ success, content, cooldown_total }` (`api/index.py:274-281`).

Trust/shape issues:

- Trusts `result.success` only; no validation of `content` shape before storing
  (`contentStore.ts:176-188`). **See BUG-7.**
- `bio: aboutResult.content || state.bio` — wrong type corrupts state (`:182`).
- Two parallel POSTs each consume the daily quota — one click = 2 hits. **See
  BUG-5.**
- Regenerated experience/education not rendered (Journey uses `timeline.yaml`).
  **See DEBT-3.**
- Redundant `finally { setTimeout(... isRegenerating:false, 1000) }` (`:220-224`).
- `About.tsx` legacy listener + nested `setTimeout` dual-update path (`:27-61`);
  dead `contentUpdated` dispatch (`:63-71`).

## 5. Code-quality signals

- **console.\*** left in prod paths: `bioLoader.ts:14,17`, `experienceLoader.ts:16,19`,
  `educationLoader.ts:14,17`, `skillsLoader.ts:14,17`, `projectLoader.ts:78,138`,
  `Skills.tsx:32`, `resume.ts:52`, plus error logs in `contentStore.ts`,
  `RepoStats.tsx:29`, `GitHubReadme.tsx:43`, `ContributionGraph.tsx:28`
  (`ErrorBoundary.tsx:42` is acceptable).
- **TODO/FIXME/HACK:** none in `frontend/src`.
- **`any`:** none in production code (only `expect.any(Object)` in tests).

## Highest-severity items

1. Direct `/projects` navigation never loads content (BUG-1).
2. Regeneration fires 2 parallel calls, doubles quota, discards partial success
   (BUG-5).
3. Client cooldown not synced with server; starts on failure (BUG-4).
4. LLM output stored without validation (BUG-7).
5. Duplicated loader boilerplate + no caching (DEBT-6).
