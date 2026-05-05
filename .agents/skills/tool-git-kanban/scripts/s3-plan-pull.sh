#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: create a dry-run pull plan where remote project items overwrite local issue files
#
# @param: --owner OWNER           GitHub user/org that owns the project
# @param: --project-number NUM    GitHub Projects v2 number
# @param: --output PATH           Optional path to write the plan JSON
# @output: JSON pull plan with action buckets; no files are modified
# @return: 0 on success
#-----------------------------------------
function main {
  local owner=""
  local project_number=""
  local output=""

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
      --output)
        output="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage_error "usage: s3-plan-pull.sh --owner OWNER --project-number NUM [--output PATH]"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "$owner" ]] || usage_error "missing --owner"
  [[ -n "$project_number" ]] || usage_error "missing --project-number"

  local local_json remote_json plan
  local_json="$($SCRIPT_DIR/s1-scan-local.sh)"
  remote_json="$($SCRIPT_DIR/s2-fetch-remote.sh --owner "$owner" --project-number "$project_number")"

  plan="$(jq -n \
    --arg owner "$owner" \
    --arg projectNumber "$project_number" \
    --argjson localItems "$local_json" \
    --argjson remoteItems "$remote_json" \
    '{mode:"pull", source:"remote", target:"local", project:{owner:$owner, number:($projectNumber|tonumber)}, summary:{create_local:"TODO", update_local:"TODO", metadata_only:"TODO", local_only:"TODO"}, local_items:$localItems, remote_items:$remoteItems, writes_require_confirmation:true}')"

  if [[ -n "$output" ]]; then
    printf '%s\n' "$plan" > "$output"
  fi
  printf '%s\n' "$plan"
}

main "$@"
