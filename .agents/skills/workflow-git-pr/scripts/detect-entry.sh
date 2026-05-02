#!/bin/bash
# =============================================================================
# detect-entry.sh
# Detect the entry point for the git-issue-to-pr workflow.
#
# Checks:
#   1. Current branch name for issue-<id>-* pattern
#   2. --issue <N> flag passed on command line
#
# Outputs a JSON line with the detected state.  Does NOT validate whether the
# issue matches the diff — that step requires LLM judgment (Step 0b).
#
# Usage:
#   ./detect-entry.sh                  # auto-detect
#   ./detect-entry.sh --issue 5        # explicit issue override
# =============================================================================

set -euo pipefail

# --------------------------------------------------------------------------
# Global state
# --------------------------------------------------------------------------
CANDIDATE_ID=""
ENTRY="A"          # A = full workflow, M = candidate found (pending validation)
BRANCH_OK=false
CURRENT_BRANCH=""

# --------------------------------------------------------------------------
# Command-line parsing
# --------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --issue)
            CANDIDATE_ID="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# --------------------------------------------------------------------------
# Detect candidate from branch name
# --------------------------------------------------------------------------
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || echo "unknown")"

if [[ -z "$CANDIDATE_ID" ]]; then
    # Match issue-<id>-<slug> with strict anchoring
    if [[ "$CURRENT_BRANCH" =~ ^issue-([0-9]+)- ]]; then
        CANDIDATE_ID="${BASH_REMATCH[1]}"
        BRANCH_OK=true
    fi
fi

# --------------------------------------------------------------------------
# Determine entry point
# --------------------------------------------------------------------------
if [[ -n "$CANDIDATE_ID" ]]; then
    ENTRY="M"
fi

# --------------------------------------------------------------------------
# Output JSON
# --------------------------------------------------------------------------
printf '{"entry":"%s","issue_id":%s,"branch_ok":%s,"current_branch":"%s"}\n' \
    "$ENTRY" \
    "${CANDIDATE_ID:-null}" \
    "$BRANCH_OK" \
    "$CURRENT_BRANCH"
