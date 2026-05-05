#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: apply a previously reviewed pull plan to local issue files
#
# @param: --plan PATH      Pull plan JSON from s3-plan-pull.sh
# @param: --confirm TOKEN Required literal token: remote-over-local
# @output: JSON apply result
# @return: 0 on success; refuses to run without explicit confirmation token
#-----------------------------------------
function main {
  local plan=""
  local confirm=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --plan)
        plan="${2:-}"
        shift 2
        ;;
      --confirm)
        confirm="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage_error "usage: s4-apply-pull.sh --plan PATH --confirm remote-over-local"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "$plan" ]] || usage_error "missing --plan"
  [[ -f "$plan" ]] || die "plan file does not exist: $plan"
  [[ "$confirm" == "remote-over-local" ]] || die "refusing pull apply without --confirm remote-over-local"

  local issues_dir
  issues_dir="$(issues_dir)"

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  local result
  result="$(python3 "$script_dir/_apply_pull.py" \
    --sync-state "$plan" \
    --issues-dir "$issues_dir" \
    --apply \
    --confirm "$confirm" 2>&1)"

  printf '%s\n' "$result"

  local applied
  applied="$(jq -r '.updated // 0' <<<"$result")"
  if [[ "$applied" -gt 0 ]]; then
    return 0
  fi
}

main "$@"
