#!/usr/bin/env bash
set -euo pipefail

BUILD_MODE="build"
MAX_WAIT=60
HOST="0.0.0.0"
PORT="4173"
LOG_FILE="$(mktemp /tmp/pnpm-build-preview.XXXXXX.log)"
PREVIEW_URL=""
DISPLAY_URLS=""
STARTUP_TIME=""

usage() {
  cat <<'EOF'
Usage: build_preview.sh [--no-build] [--host <host>] [--port <port>]

Build the testbed and keep a VitePress production preview running for human review.

Options:
  --no-build     Skip pnpm build:testbed and preview the existing dist
  --host <host>  Preview host. Default: 0.0.0.0
  --port <port>  Preview port. Default: 4173
  -h, --help     Show this help
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-build)
        BUILD_MODE="skip"
        shift
        ;;
      --host)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --host requires a value" >&2
          return 2
        fi
        HOST="$2"
        shift 2
        ;;
      --port)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --port requires a value" >&2
          return 2
        fi
        PORT="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "error: unknown argument: $1" >&2
        usage >&2
        return 2
        ;;
    esac
  done
}

enter_git_root() {
  local root
  root="$(git rev-parse --show-toplevel)"
  cd "$root"
}

wait_for_preview() {
  local elapsed=0

  while [[ $elapsed -lt $MAX_WAIT ]]; do
    sleep 2
    elapsed=$((elapsed + 2))

    if grep -qE 'http://[^[:space:]]+:[0-9]+/' "$LOG_FILE" 2>/dev/null; then
      PREVIEW_URL="$(grep -oE 'http://[^[:space:]]+:[0-9]+/' "$LOG_FILE" | tail -1)"
      STARTUP_TIME="$elapsed"
      return 0
    fi

    if grep -qE 'ELIFECYCLE|Command failed|fatal|Error:' "$LOG_FILE" 2>/dev/null; then
      echo "error: preview server failed to start" >&2
      grep -E 'ELIFECYCLE|Command failed|Error:|fatal' "$LOG_FILE" | head -20 >&2
      return 1
    fi

    if ! kill -0 "$PREVIEW_PID" 2>/dev/null; then
      echo "error: preview process exited unexpectedly" >&2
      tail -30 "$LOG_FILE" >&2
      return 1
    fi
  done

  echo "error: preview server did not start within ${MAX_WAIT}s" >&2
  tail -30 "$LOG_FILE" >&2
  return 1
}

resolve_display_urls() {
  local host_ips

  if [[ "$HOST" == "0.0.0.0" || "$HOST" == "::" ]]; then
    host_ips="$(hostname -I 2>/dev/null || true)"
    if [[ -n "$host_ips" ]]; then
      DISPLAY_URLS="$(printf "%s\n" $host_ips | awk -v port="$PORT" '{ print "http://" $1 ":" port "/" }' | paste -sd ',' - | sed 's/,/, /g')"
      return 0
    fi
  fi

  DISPLAY_URLS="$PREVIEW_URL"
}

main() {
  parse_args "$@"
  enter_git_root

  if [[ "$BUILD_MODE" == "build" ]]; then
    pnpm build:testbed
  fi

  setsid pnpm -F=testbed exec vitepress preview --host "$HOST" --port "$PORT" > "$LOG_FILE" 2>&1 &
  PREVIEW_PID=$!

  wait_for_preview
  resolve_display_urls

  cat <<EOF
| Item | Result |
|---|---|
| Mode | human build preview |
| Build | $BUILD_MODE |
| Preview URLs | $DISPLAY_URLS |
| Startup time | ${STARTUP_TIME}s |
| Log file | $LOG_FILE |
| Cleanup | Run post-PR cleanup when this preview is no longer needed |
EOF

  echo ""
  echo "Preview server is running for human review. Leave it running until the PR is merged, abandoned, or no longer needs visual inspection."
  echo "Use the post-PR cleanup workflow to stop this repo-scoped preview process."
  wait "$PREVIEW_PID"
}

main "$@"
