---
title: Claudfather portfolio presentation design review
type: audit
status: draft
owner: chrisrogers37
created: 2026-10-10
tags: [priority:high, design]
repos: [chrisrogers37/crog-gg]
---

# Claudfather portfolio presentation

## Summary

Feature **Claudfather**, the ecosystem, on crog.gg and give it a detailed portfolio page at `/projects/claudfather`. Keep crog.gg a personal site. Make this project's presentation capable, approachable and honest about alpha status, with a concrete explanation of the work and a clear path to explore further.

The portfolio page explains what Chris is building and why. The product website owns current product exploration and onboarding; public repositories own installation and reference material. First ship a clearly labelled conceptual walkthrough, then add dated captured evidence in a separate PR. A public synthetic-demo reference has already been captured for review; it demonstrates the preview UI, not agent execution.

## Why it matters

The existing page uses Claudfather's distinctive mark while naming only Claudlobby. It leads with role cards and technical breadth rather than showing what the ecosystem does. The filled action asks for a GitHub star. This makes the product harder to understand and foregrounds a maintainer outcome over the visitor's exploration.

## Context

User decisions: solo founders and small teams; capable, approachable, honest alpha; a product-focused presentation with demos and a starting path **only for the Claudfather presentation**. Other projects and the personal home page retain their portfolio purpose. User selected Claudfather replacing the featured Claudlobby project, with detail on click-in and boundaries that prevent duplication of the future product site.

Before evidence:

- [Desktop Claudlobby page](https://github.com/user-attachments/assets/61c60692-096b-4585-9377-bce9ee1f02b8): charcoal/orange hero followed by role cards, step cards, inventory counts, setup, roadmap and updates.
- [Mobile Claudlobby page](https://github.com/user-attachments/assets/b343bc0a-a002-435a-b7cc-d44c0b68967b): the same narrative becomes a long stack of noninteractive cards.
- [Current public preview reference](https://github.com/user-attachments/assets/feda46e0-2083-4e9b-a543-ae62c011b9cf), captured from `/demo` on 2026-10-10. The page visibly says synthetic data and no real bots; the public build revision was unavailable.
- `frontend/src/content/claudlobby.ts:39-47` supplies the umbrella mark, fleet headline and Star/Quickstart labels. `ClaudlobbyPage.tsx:21-27` sets the long section order. `Hero.tsx:61-72` makes stars the primary action.

## Selected design

Featured card, in the site's personal voice:

> **Claudfather**
> tools for running AI teams, giving them useful workflows, and keeping what they learn.
> **view project**

The action stays internal to `/projects/claudfather`. Use the existing mark and charcoal/orange/cream identity on the detail page. Do not turn the personal site into a product funnel or replace its typography/palette globally.

Detail page, in plain platform voice:

1. **Purpose and status.** Name Claudfather as the umbrella; proposed H1 `Build a team of AI workers.` Explain the tools for teams, workflows and knowledge. Keep the current preview qualification visible. Filled `See how it works` links to `#how-it-works`; ghost `Explore the preview` opens the verified public preview. Adjacent text explicitly says synthetic data, development preview and no real-team work.
2. **How it works.** A compact, explicitly conceptual sequence: Define the work / Run the workers / Keep and evaluate the result. This is an explanation, not a claim that a recorded run occurred. Phase 2 adds actual captured evidence beside this sequence.
3. **The ecosystem.** Concise structured rows: Claudlobby runs/composes/supervises fleets and owns Plane; clauDNA supplies engineering workflows; Claudron preserves knowledge; Claudosseum evaluates skills. Explain jobs before unfamiliar names. Link only public owning repositories. No Claudosseum source/install CTA while private.
4. **Why I built it.** A short creator case study of the problem, design choices and public lessons. Keep any personal reflection distinct from factual product claims.
5. **Explore further.** Public project/source links and one scoped local-fleet setup guide. Point to the product surface for current demos and onboarding rather than reproduce it.

The old `/projects/claudlobby` is a compatibility redirect to the new page, preserving useful fragment destinations. It is not a second long landing page. New page metadata, prerendering, share card and public references must agree with the new identity.

## Surface ownership

| Surface | Owns | Avoid duplicating |
| --- | --- | --- |
| crog.gg | Creator story, evergreen component roles, selected dated public evidence, links onward | Current install commands, inventory counts, provider/integration lists, product roadmap, live sandbox |
| Claudfather product website | Current demos, product journey, team selection, accounts/onboarding and current status | A separate privately implemented Plane UI |
| Claudlobby repository | Fleet install, safety model, operational interface/reference and releases | Portfolio biography |
| clauDNA / Claudron public repositories | Their own workflow/vault install, technical reference and releases | Fleet or website launch status |
| Public org brand/profile | Ecosystem names, roles and destinations | Private implementation details |

## Evergreen and current claims

Stable role descriptions belong on the portfolio. Captures are historical examples labelled with capture date, build/commit where available, source and illustrative/synthetic status. Link to the owning surface for what works today. Revisit an example when it becomes materially misleading; do not impose a fake expiration timer.

Keep GitHub popularity counts hidden across the ecosystem and subproject presentations. Chris reconfirmed that low counts can undersell the work. This is already implemented: `site/site.yaml:36` sets `github.show_counts: false`, and `RepoStats.tsx:90-128` omits stars, forks, watchers and issue counts in both loading and loaded states. Language, license, last update and topics may still appear. Preserve this explicit opt-in policy; no automatic threshold or aggregate ecosystem count is needed.

The public core is open source; the website implementation and Claudosseum are currently private. Do not claim everything is open source, expose private docs/assets, or imply instruction-based approvals are enforced isolation/security. Keep component-specific source rules and current-versus-planned honesty.

## Destination and CTA states

One typed destination/status record drives every portfolio product-site link and qualifier. No runtime reachability fetch, launch countdown or inferred release date.

| State | Hero secondary | Nearby qualifier |
| --- | --- | --- |
| Verified public development preview | `Explore the preview` → `https://claudfather-ai.vercel.app` | Synthetic data; real sign-in/host onboarding in development; does not send real work |
| Preview unavailable or restricted | Omit preview action; retain `See how it works` and public source/setup links | Early alpha; static explanation remains useful |
| Canonical product launch verified | `Visit claudfather.ai` → verified canonical URL | Preserve any remaining alpha/demo limitations verified at launch |

The filled `See how it works` remains the portfolio page's narrative anchor. The featured card remains internal in every state. Switching the website destination and qualifier is one deliberate content change after anonymous reachability and actual access/status verification; domain reachability alone does not prove onboarding works.

## Risks

- **RISK / high impact / medium effort:** umbrella naming and ecosystem explanation improve accuracy, but four unfamiliar names may overwhelm. Lead with one purpose and a concrete story; make component rows compact.
- **RISK / medium impact / medium effort:** recorded public-preview evidence is synthetic, so it demonstrates presentation/workflow concepts rather than real agent output. Label that limitation immediately. A public-safe local run provides stronger execution evidence but needs explicit source and redaction checks.
- Current public org README links a now-private Claudosseum repository. Do not mirror the inaccessible link. Its public role description may remain, with no source/install action.
- `claudfather.ai` timed out in this review; the public Vercel preview returned 200. Use the verified preview until the canonical launch is verified, not a guessed domain state.

## Gaps

- **SAFE / high impact / medium effort:** replace maintainer-first star CTA, repeated role-card catalogue and volatile inventory sections with a clear portfolio explanation and deliberate next steps. Phase 1.
- **SAFE / high impact / medium effort:** current crog.gg assets contain no actual fleet demonstration. Capture approved real evidence rather than invent it. Phase 2.
- **SAFE / medium impact / low effort:** centralize product destination/status qualification, source linking and dated evidence so the portfolio can stay useful without mirroring releases. Phase 1 establishes the boundary; Phase 2 adds evidence metadata.

## Observations

Existing charcoal/orange identity is recognizable and restrained. Alpha labels, pinned role/count sources and planned-provider boundaries are valuable foundations. The issue is what the presentation prioritizes, not lack of styling or a need for more decorative chrome.

The card/page copy above is a design proposal, not a claim of measured achievements. Destination/status changes are authored content updated on a material launch/access change; no automatic status monitoring. Administrative note: mandated audit labels `priority:high` and `design` are retained. Platform OS realm/theme/readiness vocabulary did not list those audit labels; the audit output guide explicitly requires them, so validation reports that mismatch without silently dropping them.

## Phased plan

| Order | PR | Class | Impact / effort | Dependency |
| --- | --- | --- | --- | --- |
| 1 | [Featured ecosystem and detailed portfolio page](01_featured-ecosystem.md) | SAFE structure + RISK umbrella story | High / medium | None |
| 2 | [Dated product evidence](02_product-evidence.md) | SAFE evidence + explicit synthetic/local tradeoff | High / medium | Phase 1 |

Each phase is one PR, with responsive/accessibility checks and repository-required validation. Phase 1 is implemented and verified locally on `codex/claudfather-portfolio`; see its verification record for results and pending deployment checks. Phase 2 remains a draft. Phase 1 is useful without Phase 2, because its walkthrough is explicitly conceptual.

## Related

- [Phase 1](01_featured-ecosystem.md)
- [Phase 2](02_product-evidence.md)
- [Public brand reference](https://github.com/Claudfather/.github/blob/main/BRAND.md)
- [Public ecosystem overview](https://github.com/Claudfather)

## Origin

Artemis Skills design audit of chrisrogers37/crog-gg, 2026-10-10; user-directed Claudfather portfolio scope and approved design direction. Public source/access checks performed on that date. No implementation or live product launch is implied by this plan.
