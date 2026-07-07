## Nice-to-haves — enhancements

Non-urgent enhancements from the 2026-07-02 system review. These are
opportunistic improvements, not fixes for broken behavior.

- [ ] **ENH-1 — Runtime schema validation for external data.** Add a small zod (or
      hand-written guard) layer at the loader/service boundaries so bad-shape YAML or
      backend/LLM JSON fails loudly and catchably instead of silently producing wrong
      types. Complements BUG-6 and BUG-7.
- [ ] **ENH-2 — Harden `logoService` and GitHub caching.** Add a timeout to the
      `new Image()` logo probe so hung requests resolve (`logoService.ts:48-52`); add
      a short negative-cache for failed GitHub fetches so repeated errors don't hammer
      the backend (`githubService.ts:66-90`).

> Note: the review surfaced **no P0 and no P4 items**. P0 (production-down /
> critical security) — none found. P4 (trivial/backlog) — none tracked separately;
> anything lower than the items above was folded into these nice-to-haves.

## References

- Tracker: `documentation/planning/tech-debt-triage_2026-07-02.md` — ENH-1, ENH-2
- Analysis: `documentation/planning/reviews/02-data-services-hooks.md` §2
