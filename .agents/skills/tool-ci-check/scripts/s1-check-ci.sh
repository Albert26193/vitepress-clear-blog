#!/bin/bash
# =============================================================================
# s1-check-ci.sh
# Get CI check status for a GitHub pull request.
#
# Usage:
#   ./s1-check-ci.sh <pr_number>
#   ./s1-check-ci.sh 7
#
# Output (JSON array to stdout):
#   [{name, status, conclusion, workflowName, detailsUrl, startedAt, completedAt}, ...]
#
# Requires: gh CLI with auth
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_check-auth.sh
. "${SCRIPT_DIR}/_check-auth.sh"

PR_NUMBER="${1:-}"

if [[ -z "${PR_NUMBER}" ]]; then
  echo '{"error":"missing required argument: pr_number"}' >&2
  echo 'usage: s1-check-ci.sh <pr_number>' >&2
  exit 1
fi

# --------------------------------------------------------------------------
# fetch_checks --- query PR check status via gh
#
# @param: $1  pr_number
# @output: JSON array of check objects
# @return: 0 on success, 1 on gh failure
# --------------------------------------------------------------------------
fetch_checks() {
  local pr="${1}"

  gh pr view "${pr}" --json statusCheckRollup --jq '
    .statusCheckRollup // [] | map({
      name:            .name,
      status:          .status,
      conclusion:      .conclusion,
      workflowName:    .workflowName,
      detailsUrl:      .detailsUrl,
      startedAt:       .startedAt,
      completedAt:     .completedAt
    })
  '
}

check_auth
fetch_checks "${PR_NUMBER}"
