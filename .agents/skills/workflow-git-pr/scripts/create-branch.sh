#!/bin/bash
# =============================================================================
# create-branch.sh
# Derive a kebab-case slug from an issue title and create an issue-<id>-<slug>
# branch.  Carries over any uncommitted changes.
#
# Usage:
#   ./create-branch.sh --issue-id 3 --title "Add dark mode toggle to footer"
#
# Output:
#   issue-3-add-dark-mode-toggle-footer
# =============================================================================

set -euo pipefail

# --------------------------------------------------------------------------
# derive_slug — strip stop-words, pick first 5 meaningful words, kebab-case
# --------------------------------------------------------------------------
derive_slug() {
    local title="$1"
    local -a stop_words=("a" "an" "the" "for" "to" "of" "in" "on" "at" "by" "with" "and" "or" "is" "be" "it" "its" "add" "support" "implement" "update" "fix")

    # Lowercase, collapse whitespace, trim
    local cleaned
    cleaned="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr -s ' ' | sed 's/^ //;s/ $//')"

    # Split into words and filter
    local -a words=()
    for w in $cleaned; do
        local sw=false
        for sw_w in "${stop_words[@]}"; do
            [[ "$w" == "$sw_w" ]] && sw=true && break
        done
        $sw || words+=("$w")
    done

    # Take first 6 meaningful words (or all if fewer)
    local -a slug_words=("${words[@]:0:6}")

    # Re-join with dashes
    local IFS="-"
    echo "${slug_words[*]}"
}

# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
main() {
    local issue_id=""
    local title=""
    local dry_run=false

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --issue-id) issue_id="$2"; shift 2 ;;
            --title)    title="$2";    shift 2 ;;
            --dry-run)  dry_run=true;  shift ;;
            *)          shift ;;
        esac
    done

    if [[ -z "$issue_id" || -z "$title" ]]; then
        echo "usage: create-branch.sh --issue-id <N> --title \"<title>\" [--dry-run]" >&2
        exit 1
    fi

    local slug
    slug="$(derive_slug "$title")"
    local branch="issue-${issue_id}-${slug}"

    if $dry_run; then
        echo "$branch"
        exit 0
    fi

    # Create the branch (carries uncommitted changes)
    git checkout -b "$branch" 2>/dev/null || {
        echo "error: failed to create branch $branch (already exists?)" >&2
        exit 1
    }

    echo "$branch"
}

main "$@"
