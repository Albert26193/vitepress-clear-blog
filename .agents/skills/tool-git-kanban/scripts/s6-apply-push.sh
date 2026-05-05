#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: apply a previously reviewed push plan to GitHub Issues and Project fields
#
# @param: --plan PATH      Push plan JSON from s5-plan-push.sh
# @param: --confirm TOKEN Required literal token: local-over-remote
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
        usage_error "usage: s6-apply-push.sh --plan PATH --confirm local-over-remote"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "$plan" ]] || usage_error "missing --plan"
  [[ -f "$plan" ]] || die "plan file does not exist: $plan"
  [[ "$confirm" == "local-over-remote" ]] || die "refusing push apply without --confirm local-over-remote"

  jq -n --arg plan "$plan" '{mode:"push", applied:false, plan:$plan, message:"apply implementation pending; confirmation gate is wired"}'
}

main "$@"
