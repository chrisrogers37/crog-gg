# Security Audit: choose-your-own-chris

## Status: ✅ COMPLETE

| Field              | Value                                   |
| ------------------ | --------------------------------------- |
| **Date**           | 2026-02-22                              |
| **Scope**          | Full codebase (frontend + backend)      |
| **Scanner**        | Manual code review + npm audit          |
| **Python scanner** | Not available (pip-audit not installed) |

---

## Findings

| #   | Severity | Category          | Finding                                                             | Location                                                            |
| --- | -------- | ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | HIGH     | Debug mode        | Flask `debug=True` in production entry point                        | `backend/app.py:577`                                                |
| 2   | HIGH     | Info disclosure   | Request headers logged (includes Authorization)                     | `backend/app.py:133`                                                |
| 3   | HIGH     | Info disclosure   | Raw request body logged                                             | `backend/app.py:136`                                                |
| 4   | HIGH     | Info disclosure   | Full OpenAI messages logged                                         | `backend/app.py:252`                                                |
| 5   | MEDIUM   | Transport         | Dev proxy disables TLS certificate verification                     | `frontend/vite.config.ts:104`                                       |
| 6   | MEDIUM   | Config            | Dev proxy targets stale port 5000 (should be 5001)                  | `frontend/vite.config.ts:102`                                       |
| 7   | MEDIUM   | Env hygiene       | No `.env.example` files exist anywhere in project                   | project-wide                                                        |
| 8   | MEDIUM   | Dep vulnerability | 13 high-severity npm audit advisories (mostly minimatch via ESLint) | `frontend/package.json`                                             |
| 9   | LOW      | Input validation  | No validation on `repo_name` URL parameter                          | `backend/app.py:391+`                                               |
| 10  | LOW      | Rate limiting     | GitHub API endpoints have no rate limiting                          | `backend/app.py`                                                    |
| 11  | LOW      | Dep hygiene       | 20 outdated npm packages                                            | `frontend/package.json`                                             |
| 12  | LOW      | XSS surface       | `rehypeRaw` allows raw HTML in markdown rendering                   | `frontend/src/components/features/GitHubReadme/GitHubReadme.tsx:97` |

### Not an issue (verified)

- `.env` files are properly gitignored and were never committed to git history
- CORS is correctly configured with specific origins (not wildcard)
- No SQL injection surface (no database)
- No command injection (no shell/exec calls)
- No `dangerouslySetInnerHTML` usage
- Rate limiting exists on `/api/regenerate` (30s cooldown per IP)
- Finding #12 is acceptable risk: content comes from owner's own GitHub READMEs

---

## Remediation Plan

### Grouping Rationale

Related findings are grouped into single PRs to reduce review overhead:

| Phase | PR Title                                                      | Findings       | Severity | Effort     |
| ----- | ------------------------------------------------------------- | -------------- | -------- | ---------- |
| 01    | Harden Flask backend: disable debug mode and sanitize logging | #1, #2, #3, #4 | HIGH     | Low        |
| 02    | Fix Vite dev proxy configuration                              | #5, #6         | MEDIUM   | Low        |
| 03    | Add .env.example documentation files                          | #7             | MEDIUM   | Low        |
| 04    | Update npm dependencies and resolve audit advisories          | #8, #11        | MEDIUM   | Medium     |
| 05    | Add input validation and rate limiting to GitHub endpoints    | #9, #10        | LOW      | Low-Medium |

Finding #12 is accepted risk and does not require a remediation PR.

### Priority Order

1. **Phase 01** (HIGH) - Backend hardening. No dependencies.
2. **Phase 02** (MEDIUM) - Dev proxy fix. No dependencies.
3. **Phase 03** (MEDIUM) - Env documentation. No dependencies.
4. **Phase 04** (MEDIUM) - Dependency updates. No dependencies.
5. **Phase 05** (LOW) - Validation & rate limiting. No dependencies.

Phases 01-03 can run in parallel (disjoint files). Phase 04 is independent. Phase 05 is independent.

### Dependency Matrix

All phases are independent and can be implemented in any order or in parallel. No phase blocks another.

---

## Ongoing Recommendations

- Add `npm audit` to CI pipeline
- Install `pip-audit` for Python dependency scanning
- Set up Dependabot or Renovate for automated dependency updates
- Add pre-commit hook for secret scanning (e.g., gitleaks, detect-secrets)
- Schedule quarterly security audits
- Consider SAST tooling (Semgrep, CodeQL) for continuous scanning

---

_Generated by `/security-audit` on 2026-02-22_
