# Issue backlog — ready to file

This directory is the concrete, ready-to-file set of GitHub issues derived from
the 2026-07-02 system review. Each markdown file is a complete issue **body**;
titles and labels are defined in [`file-issues.sh`](./file-issues.sh).

## Why these are files and not already GitHub Issues

The Cloud Agent that produced this backlog **could not create GitHub Issues**: its
GitHub App installation token has no Issues permission. Both reading
(`repository.issues`) and creating (`createIssue`) fail with:

```
GraphQL: Resource not accessible by integration
```

So the issues are committed here as durable artifacts. To turn them into real
GitHub issues, run the script from an environment whose `gh` is authenticated as a
user/token with Issues write access:

```sh
# dry run first to preview titles + labels
DRY_RUN=1 ./documentation/planning/issues/file-issues.sh

# then create labels + issues for real
./documentation/planning/issues/file-issues.sh

# if your account can't manage labels, create issues without them
NO_LABELS=1 ./documentation/planning/issues/file-issues.sh
```

## What gets filed

Per the requested plan — **P0/P1 individually, everything else clustered by tier**:

| Issue                                                                                      | Type       | Tier         | Source items                          |
| ------------------------------------------------------------------------------------------ | ---------- | ------------ | ------------------------------------- |
| [`P1-01-projects-route-loads-no-content.md`](./P1-01-projects-route-loads-no-content.md)   | Individual | P1           | BUG-1                                 |
| [`P1-02-pre-push-hook-wrong-backend-path.md`](./P1-02-pre-push-hook-wrong-backend-path.md) | Individual | P1           | BUG-2                                 |
| [`cluster-P2-correctness-and-debt.md`](./cluster-P2-correctness-and-debt.md)               | Clustered  | P2           | SEC-1, BUG-3..7, DEBT-1..6, TEST-1..3 |
| [`cluster-P3-polish-and-consistency.md`](./cluster-P3-polish-and-consistency.md)           | Clustered  | P3           | DEBT-7..10, TEST-4                    |
| [`cluster-nice-to-haves.md`](./cluster-nice-to-haves.md)                                   | Clustered  | nice-to-have | ENH-1, ENH-2                          |

**No P0 and no P4 items** were found in the review (see the nice-to-haves file for
the note). If you later reclassify SEC-1 as P1/P0, split it into its own file and
add a row to `file-issues.sh`.

## Source of truth

- Summary tracker: [`../tech-debt-triage_2026-07-02.md`](../tech-debt-triage_2026-07-02.md)
- Detailed analysis: [`../reviews/`](../reviews/)
