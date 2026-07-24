#!/usr/bin/env bash
#
# file-issues.sh — create the triaged GitHub issues from the markdown backlog
# in this directory.
#
# WHY THIS EXISTS: the Cloud Agent that produced this backlog could not create
# issues — its GitHub App token lacks the Issues permission (both
# `repository.issues` reads and `createIssue` fail with "Resource not accessible
# by integration"). Run this from an environment whose `gh` auth CAN write issues
# (e.g. `gh auth login` as a user with write access to the repo) to file them all.
#
# Usage:
#   ./documentation/planning/issues/file-issues.sh            # create labels + issues
#   NO_LABELS=1 ./documentation/planning/issues/file-issues.sh # skip labels (if label perms are missing)
#   DRY_RUN=1 ./documentation/planning/issues/file-issues.sh   # print what would be created
#
set -euo pipefail

REPO="chrisrogers37/crog-gg"
DIR="$(cd "$(dirname "$0")" && pwd)"

# file | title | comma-separated labels
ISSUES=(
  "P1-01-projects-route-loads-no-content.md|[P1] Direct navigation to /projects and /projects/:slug never loads content|bug,priority:P1,area:frontend"
  "P1-02-pre-push-hook-wrong-backend-path.md|[P1] pre-push hook targets nonexistent backend/ dir; Python never linted locally|bug,priority:P1,area:tooling"
  "cluster-P2-correctness-and-debt.md|[P2] Correctness, robustness & structural debt (cluster)|priority:P2,tech-debt"
  "cluster-P3-polish-and-consistency.md|[P3] Polish & consistency (cluster)|priority:P3,tech-debt"
  "cluster-nice-to-haves.md|[nice-to-have] Enhancements (cluster)|enhancement,nice-to-have"
)

ALL_LABELS=(
  "priority:P1|#b60205|Highest-priority, file individually"
  "priority:P2|#d93f0b|Correctness/robustness/structural debt"
  "priority:P3|#fbca04|Polish & consistency"
  "bug|#d73a4a|Broken behavior"
  "tech-debt|#5319e7|Maintainability / architecture"
  "enhancement|#0e8a16|New capability / improvement"
  "nice-to-have|#c2e0c6|Opportunistic, non-urgent"
  "area:frontend|#1d76db|Frontend"
  "area:tooling|#0052cc|CI / hooks / build"
)

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found on PATH." >&2
  exit 1
fi

# Fail fast if this environment can't access issues.
if ! gh issue list --repo "$REPO" --limit 1 >/dev/null 2>&1; then
  echo "error: this gh auth cannot access issues for $REPO." >&2
  echo "       Re-run from an environment authenticated as a user/token with" >&2
  echo "       Issues write permission (see the header of this script)." >&2
  exit 1
fi

if [ "${NO_LABELS:-0}" != "1" ]; then
  echo "== ensuring labels exist =="
  for entry in "${ALL_LABELS[@]}"; do
    IFS='|' read -r name color desc <<<"$entry"
    if [ "${DRY_RUN:-0}" = "1" ]; then
      echo "  would ensure label: $name"
    else
      gh label create "$name" --repo "$REPO" --color "${color#\#}" --description "$desc" 2>/dev/null \
        || gh label edit "$name" --repo "$REPO" --color "${color#\#}" --description "$desc" 2>/dev/null \
        || echo "  (could not create/edit label '$name' — continuing)"
    fi
  done
fi

echo "== creating issues =="
for entry in "${ISSUES[@]}"; do
  IFS='|' read -r file title labels <<<"$entry"
  body_path="$DIR/$file"
  if [ ! -f "$body_path" ]; then
    echo "  skip: missing $file" >&2
    continue
  fi
  label_args=()
  if [ "${NO_LABELS:-0}" != "1" ]; then
    IFS=',' read -ra parts <<<"$labels"
    for l in "${parts[@]}"; do label_args+=(--label "$l"); done
  fi
  if [ "${DRY_RUN:-0}" = "1" ]; then
    echo "  would create: $title  [labels: $labels]"
  else
    gh issue create --repo "$REPO" --title "$title" --body-file "$body_path" "${label_args[@]}"
  fi
done

echo "done."
