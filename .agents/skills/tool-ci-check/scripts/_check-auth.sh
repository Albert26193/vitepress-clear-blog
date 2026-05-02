#!/bin/bash
# =============================================================================
# _check-auth.sh — sourced by s0-s3 to verify gh authentication.
#
# Checks, in order:
#   1. gh auth status  (interactive login)
#   2. $GITHUB_TOKEN    (CI / env-var based auth)
#   3. $GH_TOKEN        (fallback)
#
# Exits with a clear message if none are available.
# =============================================================================

# --------------------------------------------------------------------------
# check_auth --- verify gh CLI is usable
#
# @output: none on success
# @return: 0 if authenticated, exits with 1 otherwise
# --------------------------------------------------------------------------
check_auth() {
  if gh auth status &>/dev/null; then
    return 0
  fi

  if [[ -n "${GITHUB_TOKEN:-}" ]] || [[ -n "${GH_TOKEN:-}" ]]; then
    export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN}}"
    if gh auth status &>/dev/null; then
      return 0
    fi
  fi

  echo '{"error":"gh CLI not authenticated. Run: gh auth login  or set GITHUB_TOKEN / GH_TOKEN env var"}' >&2
  exit 1
}
