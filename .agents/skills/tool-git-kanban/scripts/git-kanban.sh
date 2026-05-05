#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: dispatch tool-git-kanban script commands through a single entrypoint
#
# @param: command  discover | scan-local | fetch-remote | plan-pull | apply-pull | plan-push | apply-push
# @output: command-specific JSON
# @return: command exit code
#-----------------------------------------
function main {
  local command="${1:-}"
  [[ -n "$command" ]] || usage_error "usage: git-kanban.sh <discover|scan-local|fetch-remote|plan-pull|apply-pull|plan-push|apply-push> [args...]"
  shift || true

  case "$command" in
    discover)
      exec "$SCRIPT_DIR/s0-discover.sh" "$@"
      ;;
    scan-local)
      exec "$SCRIPT_DIR/s1-scan-local.sh" "$@"
      ;;
    fetch-remote)
      exec "$SCRIPT_DIR/s2-fetch-remote.sh" "$@"
      ;;
    plan-pull)
      exec "$SCRIPT_DIR/s3-plan-pull.sh" "$@"
      ;;
    apply-pull)
      exec "$SCRIPT_DIR/s4-apply-pull.sh" "$@"
      ;;
    plan-push)
      exec "$SCRIPT_DIR/s5-plan-push.sh" "$@"
      ;;
    apply-push)
      exec "$SCRIPT_DIR/s6-apply-push.sh" "$@"
      ;;
    *)
      usage_error "unknown command: $command"
      ;;
  esac
}

main "$@"
