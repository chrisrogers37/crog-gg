## P3 cluster — polish & consistency

Grouped P3 items from the 2026-07-02 system review. Lower urgency; batch when
touching the relevant areas. Full evidence in
`documentation/planning/tech-debt-triage_2026-07-02.md`.

- [ ] **DEBT-7 — Split `HomePage.tsx` and centralize section config.** The
      336-line page mixes routing state, preview mode, section rendering, header, nav,
      regen, SEO, mobile menu, and skeletons. Extract a single `sections.config.ts`
      (id/label/order) shared by the nav components, and rename one of
      `SectionNav`/`SectionNavigator` for clarity.
- [ ] **DEBT-8 — Clean up dependencies.** Remove the orphan
      `react-transition-group` from root `package.json`; move `@types/js-yaml` to
      `devDependencies`; drop `react-router` (only `react-router-dom` is imported);
      consider replacing `react-transition-group` in `About.tsx` with Framer Motion
      and removing it entirely; add `pytest`/`flake8`/`black`/`isort` to a declared
      dev/test dependency set.
- [ ] **DEBT-9 — Remove debug logging.** Strip or gate behind `import.meta.env.DEV`
      the `console.log`/`console.error` dumps in the loaders (`bioLoader.ts:14`, etc.),
      `Skills.tsx:32`, and `resume.ts:52`.
- [ ] **DEBT-10 — De-duplicate social links & username.** Source
      GitHub/LinkedIn/Spotify links from `bio.yaml` everywhere (currently hardcoded in
      `MobileMenu.tsx:127-153` and `Footer.tsx:18-31`); centralize the `chrisrogers37`
      username (duplicated in `GitHubReadme.tsx` and `api/_lib/request_utils.py:9`).
- [ ] **TEST-4 — Close coverage/E2E gaps.** Add `thresholds` to `vitest.config.ts`;
      run Flask alongside Playwright so `/api/*` is exercised (and/or add a
      cross-browser project); include test files in `tsc` so type errors in tests
      fail the build.

## References

- Tracker: `documentation/planning/tech-debt-triage_2026-07-02.md`
- Analysis: `documentation/planning/reviews/`
