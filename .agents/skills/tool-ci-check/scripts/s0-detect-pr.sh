#!/bin/bash
# =============================================================================
# s0-detect-pr.sh
# Detect the GitHub pull request associated with the current git branch.
#
# Usage:
#   ./s0-detect-pr.sh
#
# Output (JSON to stdout):
#   {"pr_number":"7","branch":"issue-6-ci-cd-pipeline-fix-tests","found":true}
#   {"pr_number":null,"branch":"master","found":false}
#
# Requires: gh CLI with auth, git
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_check-auth.sh
. "${SCRIPT_DIR}/_check-auth.sh"

# --------------------------------------------------------------------------
# detect_pr --- find the PR whose head branch is the current branch
#
# @output: JSON with pr_number, branch, found
# @return: 0 if detection ran (even if no PR found), 1 on tool failure
# --------------------------------------------------------------------------
detect_pr() {
  local branch pr

  branch="$(git branch --show-current)"
  if [[ -z "${branch}" ]]; then
    echo '{"pr_number":null,"branch":"","found":false,"error":"not in a git repo or detached HEAD"}' >&2
    exit 1
  fi

  pr="$(gh pr list --head "${branch}" --json number --jq '.[0].number // ""' 2>/dev/null)" || true

  if [[ -z "${pr}" ]]; then
    printf '{"pr_number":null,"branch":"%s","found":false}\n' "${branch}"
  else
    printf '{"pr_number":"%s","branch":"%s","found":true}\n' "${pr}" "${branch}"
  fi
}

check_auth
detect_pr
