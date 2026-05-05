#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: fetch remote GitHub Project items for pull/push planning
#
# @param: --owner OWNER           GitHub user/org that owns the project
# @param: --project-number NUM    GitHub Projects v2 number
# @param: --limit NUM             Maximum project items to fetch, defaults to 1000
# @output: JSON returned by gh project item-list
# @return: 0 on success
#-----------------------------------------
function main {
  local owner=""
  local project_number=""
  local limit="1000"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --owner)
        owner="${2:-}"
        shift 2
        ;;
      --project-number)
        project_number="${2:-}"
        shift 2
        ;;
      --limit)
        limit="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage_error "usage: s2-fetch-remote.sh --owner OWNER --project-number NUM [--limit NUM]"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "$owner" ]] || usage_error "missing --owner"
  [[ -n "$project_number" ]] || usage_error "missing --project-number"

  require_gh_project_auth
  gh project item-list "$project_number" --owner "$owner" --format json --limit "$limit"
}

main "$@"
