---
title: Add dated public-safe evidence to the Claudfather portfolio page
type: plan
status: draft
owner: chrisrogers37
created: 2026-10-10
tags: [priority:high, design]
repos: [chrisrogers37/crog-gg]
---

# Phase 2: dated product evidence

## Summary

Add one actual captured still or short recording to the Claudfather portfolio walkthrough. Clearly distinguish a synthetic public-preview capture from a verified local run. Keep the sample as dated case-study evidence and link to the product website for its current demo, without mirroring a live sandbox.

PR title: `feat: add dated Claudfather portfolio evidence`. Class: SAFE, high impact, medium effort. Risk: medium because misleading or private material can undermine trust. One PR. Dependency: [Phase 1](01_featured-ecosystem.md), including its content module, detailed page, conceptual walkthrough and shared destination record.

## Why it matters

The existing page has no product screen or captured output. Its strong brand mark and capability prose make a useful introduction but cannot show the experience. A concrete, accurately labelled capture improves understanding without making crog.gg the owner of current onboarding or product state.

## Context

Before screenshots: [desktop](https://github.com/user-attachments/assets/61c60692-096b-4585-9377-bce9ee1f02b8), [mobile](https://github.com/user-attachments/assets/b343bc0a-a002-435a-b7cc-d44c0b68967b). Existing `frontend/src/components/sections/Claudlobby/ClaudlobbyPage.tsx:21-27` renders text/card sections only; `frontend/src/content/claudlobby.ts:61-99` gives source-pinned roles, not evidence of a recorded run. The Phase 1 replacement supplies an explicitly conceptual `#how-it-works` sequence.

Available captured candidate: [public demo reference](https://github.com/user-attachments/assets/feda46e0-2083-4e9b-a543-ae62c011b9cf), captured from `https://claudfather-ai.vercel.app/demo` on 2026-10-10. It visibly labels synthetic data and no real bots. No request was submitted. The public build revision was unavailable. This is evidence of the preview UI only; readable responsive presentation and content provenance still need implementation.

Current available public preview: `https://claudfather-ai.vercel.app`, verified 2026-10-10. Public org overview labels it synthetic, in development and unable to send work to a real team. Website source repository and Claudosseum are private. Private access does not authorize publishing their screenshots, documents, media or implementation details.

## Files modified

- `frontend/src/content/claudfather.ts` (new in Phase 1): optional typed evidence record with source, capture metadata and captions.
- `frontend/src/components/sections/Claudfather/HowItWorks.tsx` (Phase 1): insert the evidence figure beside/after its conceptual sequence.
- `frontend/src/components/sections/Claudfather/ProductEvidence.tsx` (new) and the Phase 1 Claudfather stylesheet: accessible static media presentation.
- `site/public/project-media/claudfather/` (new): approved optimized capture and optional poster/recording; no raw private captures in the repo.
- Focused component/content tests and `frontend/e2e/` coverage for this figure where appropriate.
- `documentation/CONTENT.md`, `CLAUDE.md` if its content routing changes, and `CHANGELOG.md`: source ownership and new visible behavior.

Use Phase 1's final component names if they differ. Do not introduce a second content registry or replace its destination record.

## Implementation Plan

### Steps

1. **Choose and verify the evidence before building a media component.** The captured public `/demo` still is a candidate. Verify it remains representative and readable, or capture a narrower moment from that anonymously accessible synthetic preview. Record actual capture date, URL and public build identifier when discoverable; never infer a commit from a deployment name. Alternatively perform one bounded local run on public-safe fixtures and record its exact public component commit(s), inputs, observed steps and actual output. Do not claim successful execution from a conceptual mockup. If no approved evidence can be captured, keep Phase 1's conceptual walkthrough and leave this phase incomplete.
2. **Capture a narrow understandable moment.** Show one progression or review/result state, not an unreadable dashboard mosaic. Remove sensitive content before capture using synthetic/public fixture data; inspect visible names, repo paths, tokens, logs, notifications and browser chrome. Use public preview media only; private repo screenshots/media require explicit publication approval. Captures do not include credentials or fabricated business outcomes.
3. **Add a typed provenance record.** The content lives in `frontend/src/content/claudfather.ts`, while current demo destinations come from Phase 1's shared record. Distinguish source classification and verified outcome. Capture metadata is supplied from observation, never placeholder values in shipped content.

Before (Phase 1 conceptual shape; reconcile with its final field names):

```ts
howItWorks: {
  kind: "conceptual",
  heading: "How it works",
  steps: conceptualSteps,
}
```

After (proposed addition, no invented values):

```ts
type Evidence = {
  kind: "synthetic-preview" | "verified-local-run";
  capturedOn: string;
  sourceUrl: string; // public source or public commit-pinned reference
  sourceBuild?: string; // only if actually known
  componentCommits?: { name: string; url: string }[];
  image: string;
  alt: string;
  caption: string;
  observed: string[];
  recording?: { src: string; poster: string; transcript: string };
};
// Optional alongside conceptual explanation, not a replacement claim.
// Property in the content type (the runtime value either supplies or omits evidence):
type HowItWorks = { /* existing explanation fields */ evidence?: Evidence };
```

For preview captures the caption begins `Synthetic development preview, captured [actual date].` Include its inability to send real work adjacent to the media. For local evidence identify it as a dated observed run and state exactly what was observed; no implication that every role/workflow/provider supports that behavior. Build/commit is shown as available; unavailable build information is stated rather than invented. Commit links must be publicly reachable. Avoid secret-like placeholders or internal path/source links.

4. **Render one accessible figure.** `ProductEvidence.tsx` uses `<figure>`, meaningful alt text and `<figcaption>` with date/source/classification. A still is the default. For a recording, use an explicit play control/native controls, no autoplay, no forced loop, a poster and adjacent textual transcript; spoken audio also needs synchronized captions. Explain the evidence in prose so a screen-reader user gets the same useful sequence/outcome. Link `Explore the current preview` or the verified launched label through Phase 1's shared destination record, not a hardcoded second URL.
5. **Keep media static and bounded.** Store optimized WebP/AVIF still with explicit intrinsic dimensions and sensible `sizes`/variants where useful. Use `loading="lazy"` for the below-hero figure and reserve its aspect ratio to avoid layout shift. Crop neither important operational labels nor disclosure. A short optional recording must have an intentionally chosen size/duration and compressed delivery; verify it on a throttled connection. Do not add video dependencies for a simple capture.
6. **Describe the ownership boundary.** Update the content guide: evidence is a dated portfolio sample, not a continuously synced current demo. Revise only when materially misleading or the underlying source requires removal, not an arbitrary age timer. Future product status remains the product site's job. Add visitor-facing changelog entry and meaningful checks below.

### Visual spec and responsive behavior

Preserve the page's charcoal/orange/cream branding; keep the product UI's own captured colors/type intact inside the figure rather than re-skinning the evidence. Retain and existing 8 px radius/button vocabulary. Let the evidence, rather than decorative cards, supply the next strong visual anchor. Place it after the purpose/alpha block within `#how-it-works` so the hero action lands on both explanation and evidence.

At 1440 px: one substantial readable figure beside/above concise explanatory text; no four-screen collage. At 768 px: stack if labels lose readability. At 375 px: full available content width with a visible caption and disclosure; show a focused capture sized for readable details, and a link to open the full image when needed. Do not horizontally overflow. Source/build labels wrap. Preserve all contextual information in the textual transcript/caption. Current product demo opens externally, not inside an iframe: no CSP expansion required.

## Test Plan

- Content/component tests verify that either evidence classification renders its correct disclosure/date/source and observed sequence; no evidence renders only the conceptual walkthrough. Check source policy and required provenance in deterministic tests; verify anonymous external availability manually before publication. Do not make the test suite depend on live network availability. Do not snapshot every pixel or mirror implementation constants.
- Verify local versus synthetic captions cannot accidentally cross-label; optional recording renders controls/transcript and does not autoplay. Use the site's fixture strategy from `CLAUDE.md` rather than importing owner assets into unrelated generic tests.
- Run frontend `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run site:check`, `npm run build`, `npm run test:e2e` from `frontend/`, plus remaining applicable rows of `CONTRIBUTING.md` before PR. API-specific checks only when their rows require them; this phase should not change Python.
- Manually inspect 1440×900, 768×1024 and 375×812, light/dark, keyboard, screen-reader reading order, zoom and slow-network loading. Capture after screenshots of the figure at all three sizes.

## Verification Checklist

- [ ] Actual capture/run occurred; date/source/build/commits match recorded observation.
- [ ] Public anonymous viewer can access every offered external source/destination.
- [ ] Synthetic disclosure is visible beside the media; no claim preview operates a real fleet.
- [ ] Local-run caption lists only observed behavior and public-safe inputs/output.
- [ ] No private media, repository implementation details, credentials, real customer data or notifications appear in assets or metadata.
- [ ] Still/recording communicates one concrete moment; readable caption/transcript covers essential information at phone width.
- [ ] Explicit media dimensions prevent layout shift; no horizontal overflow or automatic playback.
- [ ] Link to current product demo comes from Phase 1's shared destination record.
- [ ] Existing alpha/current-versus-planned claims and personal portfolio scope remain accurate.
- [ ] Applicable checks pass; documentation/changelog and reviewable after evidence are present.

## What NOT To Do

- Do not create a fictional product screen, simulate a successful run and call it real, or convert an illustrative storyboard into product evidence.
- Do not publish private repository screenshots/docs because the agent can read them.
- Do not embed the live site, broaden CSP, add autoplay or make the portfolio own authentication/onboarding.
- Do not copy current setup commands, provider lists, role inventory counts or roadmap into the evidence section.
- Do not add automatic expiration/countdown, runtime status probing or hidden fallback claims. A dated sample can remain useful after the product changes.
- Do not make a local run look representative of untested roles or infer enforced approval/security guarantees from agent instructions.

## Related

- [Overview](00_OVERVIEW.md)
- [Required Phase 1](01_featured-ecosystem.md)
- [Public brand/source rules](https://github.com/Claudfather/.github/blob/main/BRAND.md)
- [Public ecosystem overview](https://github.com/Claudfather)

## Origin

Artemis Skills design audit of chrisrogers37/crog-gg, 2026-10-10. User approved a Claudfather ecosystem portfolio presentation with demos and a clear starting path; the personal site globally remains a portfolio. This document plans one evidence PR and does not authorize publication of private material.
