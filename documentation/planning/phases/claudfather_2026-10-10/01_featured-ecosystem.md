---
title: Replace the featured Claudlobby story with the Claudfather ecosystem
type: plan
status: in-progress
owner: chrisrogers37
created: 2026-10-10
tags: [priority:high, design]
repos: [chrisrogers37/crog-gg]
---

## Summary

One PR replaces the featured Claudlobby entry with Claudfather and gives `/projects/claudfather` an evergreen ecosystem overview. The personal portfolio introduces what Chris is building; its project page explains the family and points visitors to the source that owns the next step. This phase works without demo media.

SAFE: clear ownership, honest preview copy, authoritative links and compatibility. RISK: changing featured identity/route; preserve old links. Effort: medium. Frontend/content/SEO/deployment configuration/documentation only.

## Why it matters

The current story covers a fleet compositor, while the intended project is the broader Claudfather family. Copying inventory counts, install requirements and provider/roadmap lists into the portfolio creates competing sources. Concise roles, honest walkthrough and owner links give visitors a clear starting path without a second product manual.

## Context

crog.gg remains Chris's personal website. Home, timeline, music and other project rows keep their personal voice and compact card treatment. The Claudfather click-in page uses plain product voice and the existing scoped orange/charcoal tokens/avatar.

Current file evidence:

- `site/public/content/projects/claudlobby.yaml` owns the current id/title/description/repo/share card; `projects/index.yaml` features it.
- `frontend/src/components/sections/Projects/FeaturedProject.tsx` renders `view project` and GitHub actions on home and index.
- `frontend/src/content/ownPages.ts:6` and `projectPages.ts` register `claudlobby` and its loading hero.
- `frontend/src/components/sections/Claudlobby/ClaudlobbyPage.tsx:21-27` renders role, workflow, quantity, setup and roadmap catalogs from `content/claudlobby.ts`.
- `frontend/src/content/links.ts`/`components/common/RepoLink.tsx` identify the Claudlobby repo front page for analytics; an organization link is different.
- `frontend/src/seo/prerender.ts` derives project landing pages from index data; `vercel.json` uses cleanUrls with no SPA catch-all.

Before screenshots: [desktop](https://github.com/user-attachments/assets/61c60692-096b-4585-9377-bce9ee1f02b8), [mobile](https://github.com/user-attachments/assets/b343bc0a-a002-435a-b7cc-d44c0b68967b).

Verified review sources: [organization](https://github.com/Claudfather), [brand document](https://raw.githubusercontent.com/Claudfather/.github/main/BRAND.md). Claudosseum is private; describe its documented evaluation role without source/install actions or public/open-source claims. A timed-out custom-domain request is not proof the domain is universally down. Current preview URL responded during review, but does not establish real team activation or launch readiness.

## Visual spec

### Portfolio card

Title `Claudfather`; retain robot icon/current featured card. Personal description:

> tools for running AI teams, giving them useful workflows, and keeping what they learn.

Filled `view project` links internally to `/projects/claudfather`. This card needs only its existing internal action; the detailed page offers source links. Set `technologies: []` for this ecosystem entry so it does not inherit Claudlobby's low-level technology pills. Preserve all other compact project rows and generic featured defaults for forks.

### Detailed page

Hero eyebrow `Claudfather · Featured project` where applicable. H1 `Build a team of AI workers.` Subhead:

> Tools for running a team, giving it reusable workflows, and keeping what it learns. For solo founders and small teams.

Preserve avatar, charcoal/cream panel and orange filled button.

Filled `See how it works` -> `#how-it-works`, which exists in this phase. Ghost `Explore the preview` -> `https://claudfather-ai.vercel.app`. Adjacent visible caveat: `Development preview with synthetic data. It does not run a real team.` Minor `View source organization` link is separate from buttons. Do not expose unverified `claudfather.ai` as current live action.

One typed website destination record drives hero/start/footer labels, URL and caveat. Current `preview` state has the URL/copy above. Future `live` state is an authored change only after explicit destination/claims verification, label `Visit claudfather.ai`, URL `https://claudfather.ai`; author its accurate caveat then. A state switch does not by itself prove operational readiness. If that preview later becomes unavailable, an authored `website: null` hides the outbound action while retaining the explanation and repository links. No runtime fetch, clock, health/auth guess or launch timer.

Sections:

1. **Overview**: `The pieces have different jobs. Use the project that fits the work you want to do.`
2. **How the pieces fit**, id `how-it-works`: semantic ordered text walkthrough, visible label `Illustrative workflow`. Explain that the tools can be used independently; do not imply a recorded run or automatic integration. Steps `Define the work` / `Run the workers` / `Keep and evaluate the result`; text `Choose a task and a reusable engineering workflow.` / `Compose a fleet with Claudlobby and inspect its plan before activating it.` / `Use durable knowledge and evaluation tools where they fit your workflow.` No fake operator UI or manufactured result. Phase2 adds verified evidence to this section.
3. **The family**: four unboxed/divider-separated rows, function first, project name second, one factual sentence. `Run your team / Claudlobby`: `Compose, install and supervise a fleet of workers.` `Give it a workflow / clauDNA`: `Reusable engineering skills for planning, building, review, verification and operations, also useful on their own.` `Keep what it learns / Claudron`: `Capture and recall durable knowledge in Markdown vaults, also useful on its own.` `Evaluate workflows / Claudosseum`: `Compare skills and experiments.` Link only verified public repos Claudlobby/clauDNA/Claudron; Claudosseum has no source/install CTA. Plane is Claudlobby's shared operational view, not a fifth product. Attach dated/pinned evidence metadata to roles.
4. **Why I'm building it**: a short creator section. Proposed copy: `The project explores a practical question: how can a small team give AI workers useful workflows, shared knowledge and a way to improve?` Treat this as reviewable draft copy, with no invented usage, results or customer stories.
5. **Get started**, id `quickstart`: render current website destination/caveat from the same record; one text link `Set up a local fleet with Claudlobby` -> owning `documentation/getting-started.md` guide at `https://github.com/Claudfather/Claudlobby/blob/main/documentation/getting-started.md`. No copied prerequisites/install commands/time promise.
6. **Follow the projects**: concise owner links. Preserve `updates`, `roadmap`, `claudlobby` IDs adjacent to respective releases, current-plan docs and Claudlobby family/source links; these are useful compatibility destinations, not duplicate catalogs.

Ownership: portfolio owns evergreen purpose, creator relationship, concise roles and dated evidence; product site owns live onboarding/hosted demo/status/roadmap; repositories own install/reference/releases.

GitHub presentation: preserve `site/site.yaml`'s existing `github.show_counts: false`. Stars, forks, watchers and issue counts remain hidden on subproject pages, during loading too. Existing language/license/update/topic metadata can remain. New ecosystem or component presentations must not add their own popularity badges, aggregate counts or an automatic re-enable threshold. Re-enabling counts is a deliberate future content decision.

### Responsive behavior and accessibility

Keep shared 1040 px column, current hero grid and tokens. Desktop family row: function/name label column + flexible text, subtle divider. <=768px stack label/body; at 375 px retain current full-width hero treatment and readable wrapping. No equal card grid or clipped fixed-height hero. Body >=16 px; 44 px controls. Preserve focus-visible, dark/light contrast, semantic heading/list structure, reduced-motion and meaningful image alt. Target WCAG AA; do not claim AAA. Anchors retain shared scroll-margin below sticky header. No new animation needed. Frame the dated product-site capture in this portfolio layout; do not mirror the product site's evolving typography or full design system.

## Dependencies

No dependency on phase 2 media. The conceptual section makes the hero anchor valid now. Before merge, pin per-role evidence to verified sources and keep private implementation excerpts out of public copy. Phase2 uses `content/claudfather.ts`, `Claudfather/HowItWorks.tsx` and optional `ProductEvidence.tsx` metadata/component.

## Build decisions

Started: 2026-10-10. User authorized implementation after design review. Codebase comparison confirmed the existing featured card and own-page frame can be reused. The ecosystem uses CreativeWork metadata rather than inheriting a component license/runtime. Genuine Claudlobby repository clicks gain a `family` location on the existing `repo_click` event; preview, organization and illustrative workflow links do not emit legacy conversion events. The fictional fork fixture stays unchanged. This personal project has no configured Linear workstream; do not file it in the skill's hardcoded Artemis data team.

## Implementation Plan

### Steps

1. Rename owner's project YAML to `claudfather.yaml`; update id/title/description/share card, index featured and list together. Keep exact-one-featured/order rules. Organization is external `url`; omit `github` (repository field). No API owner changes.

Before:

```yaml
featured: claudlobby.yaml
# project entry
id: claudlobby
title: Claudlobby
github: https://github.com/Claudfather/Claudlobby
```

After:

```yaml
featured: claudfather.yaml
# project entry
id: claudfather
title: Claudfather
url: https://github.com/Claudfather
# No github: an organization is not a repository.
```

2. Add bounded typed `frontend/src/content/claudfather.ts` and specialized `components/sections/Claudfather/` page, Hero, HowItWorks, Family, GetStarted and OwnerLinks components. Reuse existing page/button/palette/mark/loading primitives. Remove old rendered roles/counts/prerequisites/providers/roadmap copy from this own-page path; do not retain competing stories. Role evidence keeps `{source,asOf}`; destination is one discriminated authored record:

```ts
type WebsiteDestination =
  | { state: "preview"; url: string; label: string; caveat: string }
  | { state: "live"; url: string; label: string; caveat: string };
// The content property is WebsiteDestination | null; null hides the outbound action.
// Current record uses only the verified preview and honest synthetic caveat.
```

3. Switch `ownPages.ts`/`projectPages.ts` own-page and loading keys to `claudfather`. Keep the generic featured card's existing internal `view project` action and defaults; changing the project id changes its destination. Do not add an organization-only URL to its repository action. Standard project details remain unchanged. New org URL must return null from `utils/projectLinks.ts` `githubRepo`; own page never requests org stats/README.

4. Add client and server compatibility redirect. Vercel addition:

```json
{"source":"/projects/claudlobby","destination":"/projects/claudfather","permanent":true}
```

Client redirect uses `useLocation()` and `<Navigate to={`/projects/claudfather${search}${hash}`} replace />` before dynamic project matching. No fixed target fragment; incoming fragments reach preserved IDs. Browsers omit fragments from server requests, so verify real redirect retention too.

5. Confirm new index produces `projects/claudfather.html`, canonical/head/schema/breadcrumbs/sitemap/share image agree. Old route is redirect, not second indexed project. Update `router.test.tsx` route/prerender contract to recognize redirect target; preserve cleanUrls and real 404 unknown paths. No hard-coded second site origin.

6. Preserve legacy analytics semantics in `services/analytics.ts`, `RepoLink.tsx`, `content/links.ts`: org/preview/walkthrough clicks are not Claudlobby `repo_click`. Keep genuine Claudlobby repo clicks' existing meaning; do not silently redefine quickstart/updates as product activation. Default no new analytics events; any new ones require explicit names/docs/tests.

7. Replace obsolete own-page assertions in `content/claudlobby.test.ts`, specialized tests, `site-check/projects.test.ts`, `cards.test.ts`; retain no-em-dash, sourced/date/claim honesty checks. Generic unit tests use site.example and virtual config; owner-specific content rules stay site-check. Extend fixture deliberately where an own page is exercised; do not require every fork to list Claudfather.

8. Update `site/claudlobby-card.html`/PNG naming and regenerate with existing card renderer to Claudfather identity. Match share_card alt/head image. Update CLAUDE.md voice/content mapping, documentation/CONTENT.md ownership, README project/analytics description and CHANGELOG. Other docs link authoritative owners rather than copy requirements.

## Test Plan

Regressions: featured home/index internal link; new own page; no-media walkthrough; old query/hash retention and all compatibility anchors; organization cannot produce repo widgets/legacy repo-click; private row has no source/install CTA; destination record consistency; preview caveat visible. Break guarded behavior once to prove tests fail. Inspect 375/768/1440, both themes and loading state.

Run frontend CONTRIBUTING rows from `frontend/`:

```sh
npm run lint
npm run typecheck
npm run test:run
npm run test:e2e
SITE_DIR=site.example npm run test:e2e
npm run build
SITE_DIR=site.example npm run site:check
SITE_DIR=site.example npm run build
```

API checks only if API is touched (none planned). Inspect actual prerendered output and deployed redirect; dev SPA success alone is insufficient. No paid SUMMON presses.

## Verification Checklist

- [x] Portfolio remains personal; compact rows/palette/avatar preserved.
- [x] Featured Claudfather -> new own page; old URL/query/fragments survive in client tests. The Vercel permanent redirect is configured and contract-tested; deployment verification remains below.
- [x] Hero walkthrough anchor works without media; illustration is visibly honest.
- [x] Four roles have pinned/date evidence; no implied automatic integration.
- [x] Private evaluation tooling has no public/open-source/install claim.
- [x] Single authored website destination/caveat drives actions; no readiness inference.
- [x] Current preview warns synthetic data/no real team; unverified custom domain not live CTA.
- [x] No duplicated counts/install/provider/roadmap catalogs remain rendered.
- [x] Organization triggers no repo widgets or legacy repo-click event.
- [x] GitHub popularity counts remain hidden on all subproject pages; existing `RepoStats` loading/loaded suppression tests pass and new sections introduce no count badges.
- [x] Prerender/head/schema/sitemap/card agree; unknown paths remain 404.
- [x] Keyboard/focus/44px/overflow/theme checks at 375/768/1440 and both-site frontend checks pass. Existing theme contrast tokens retained; no claim of a full accessibility certification.
- [x] Source docs/share card/CHANGELOG updated in the working tree.

## Local build verification

Implemented locally on `codex/claudfather-portfolio`, 2026-10-10. No commit, PR, deployment or production verification is implied by this status. Phase 2 remains a separate draft.

| Check | Result |
| --- | --- |
| Lint and typecheck | Passed |
| Full unit/site suite | 479 passed, 1 structural skip |
| Owner browser suite | 86 passed initially; 2 mobile theme test setup failures corrected and passed; final focused page/analytics run 14 passed |
| Fictional fork browser suite and build | 71 passed, 17 structural skips |
| Fictional fork site check | 12 passed, 7 structural skips |
| Owner production build | Passed; new project HTML, metadata, sitemap and share asset generated |
| Redirect regression guard | Removing hash preservation failed all 4 cases; restored and passing |
| Visual inspection | Desktop and phone in light/dark; existing mark and palette, compact rows, no horizontal overflow |
| Read-only implementation comparison | No actionable gaps |

Pending release checks: verify the actual Vercel HTTP redirect (including browser query/fragment retention) and unknown-path 404 after a preview deployment. The dev server cannot prove deployment routing. No API changes or paid regeneration calls.

## What NOT To Do

No product-funnel redesign of home, broad CMS or new dependencies. No fake UI/proof, invented outcome/count, automatic-integration claim, public private-source link or silent analytics redefinition. No launch clocks/health probing, duplicate live manuals, discarded old fragments or catch-all rewrite to conceal missing prerender. Do not weaken evidence tests just to pass new copy.

## Related

[Overview](00_OVERVIEW.md) and [Phase 2](02_product-evidence.md). Repository guidance: CLAUDE.md, CONTRIBUTING.md, documentation/CONTENT.md. Phase2 enhances `#how-it-works`; phase 1 does not wait for it.

## Origin

Interactive crog.gg design audit, 2026-10-10. User selected personal portfolio with product-focused Claudfather ecosystem and authoritative destination ownership. Phase 1 implemented and verified locally on 2026-10-10; release work remains as noted above.
