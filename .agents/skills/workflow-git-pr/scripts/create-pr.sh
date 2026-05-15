#!/bin/bash
# =============================================================================
# create-pr.sh
# Push the current branch and create a GitHub PR referencing the issue.
#
# Prerequisites: GH_TOKEN set or gh auth status must be logged in.
#
# Usage:
#   ./create-pr.sh \
#       --issue-id 3 \
#       --title "feat: #3 add dark mode toggle to footer" \
#       --body "$(cat /tmp/pr-body.md)" \
#       --base master
#
# Output:
#   https://github.com/Owner/Repo/pull/N
# =============================================================================

set -euo pipefail

# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
main() {
    local issue_id=""
    local title=""
    local body=""
    local base="master"
    local branch=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --issue-id) issue_id="$2"; shift 2 ;;
            --title)    title="$2";    shift 2 ;;
            --body)     body="$2";     shift 2 ;;
            --base)     base="$2";     shift 2 ;;
            *)          shift ;;
        esac
    done

    if [[ -z "$issue_id" || -z "$title" ]]; then
        echo "usage: create-pr.sh --issue-id <N> --title \"<subject>\" [--body \"<body>\"] [--base master]" >&2
        exit 1
    fi

    branch="$(git branch --show-current)"
    if [[ ! "$branch" =~ ^issue-${issue_id}- ]]; then
        echo "error: current branch ($branch) does not match issue-${issue_id}-* pattern" >&2
        exit 1
    fi

    # Enforce single-commit rule: must have exactly 1 commit ahead of base
    local commits_ahead
    commits_ahead="$(git rev-list --count "origin/${base}..HEAD" 2>/dev/null || echo "0")"

    if [[ "$commits_ahead" -eq 0 ]]; then
        echo "error: no commits ahead of origin/${base}; nothing to PR" >&2
        exit 1
    elif [[ "$commits_ahead" -gt 1 ]]; then
        echo "error: branch has ${commits_ahead} commits ahead of origin/${base}; exactly 1 required." >&2
        echo "       squash your commits first (e.g. git rebase -i HEAD~${commits_ahead})" >&2
        exit 1
    fi

    # Default body if none provided
    if [[ -z "$body" ]]; then
        body="Closes #${issue_id}"
    fi

    # Rebase onto latest origin/master before pushing
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if ! bash "${script_dir}/rebase-before-push.sh"; then
        echo "error: rebase failed; fix conflicts and re-run" >&2
        exit 1
    fi

    # Push with upstream tracking
    git push -u origin "$branch"

    # Create PR via gh CLI
    local pr_url
    pr_url="$(gh pr create \
        --title "$title" \
        --body "$body" \
        --base "$base" 2>&1)"

    echo "$pr_url"
}

main "$@"
