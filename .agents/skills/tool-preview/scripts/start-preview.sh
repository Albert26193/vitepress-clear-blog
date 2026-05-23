#!/usr/bin/env bash
set -euo pipefail

# Global defaults (set once at startup, treated as read-only after parse_args)
SITE="testbed"
MODE="dev"
PORT=""
HOST="0.0.0.0"
NO_BUILD="false"
MAX_WAIT=60
LOG_FILE=""
PREVIEW_URL=""
DISPLAY_URLS=""
STARTUP_TIME=""
PREVIEW_PID=""

usage() {
  cat <<'EOF'
Usage: start-preview.sh [--site <name>] [--mode <dev|preview>] [--port <port>] [--host <host>] [--no-build]

Start a local VitePress preview server with automatic port allocation.

Options:
  --site <name>   Site to preview: testbed, demo, or intro. Default: testbed
  --mode <mode>   Preview mode: dev (fast, hot-reload) or preview (production build).
                  Default: dev
  --port <port>   Port to listen on. Default: auto-allocate from 5000 upward
  --host <host>   Bind address. Default: 0.0.0.0
  --no-build      Skip build step (preview mode only)
  -h, --help      Show this help
EOF
}

#-----------------------------------------
# overview: parse CLI arguments into global variables
#
# @output: sets SITE, MODE, PORT, HOST, NO_BUILD globals
# @return: 2 on parse error, 0 otherwise
#-----------------------------------------
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --site)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --site requires a value (testbed, demo, intro)" >&2
          return 2
        fi
        if [[ "$2" != "testbed" && "$2" != "demo" && "$2" != "intro" ]]; then
          echo "error: unknown site '$2'. Valid: testbed, demo, intro" >&2
          return 2
        fi
        SITE="$2"
        shift 2
        ;;
      --mode)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --mode requires a value (dev, preview)" >&2
          return 2
        fi
        if [[ "$2" != "dev" && "$2" != "preview" ]]; then
          echo "error: unknown mode '$2'. Valid: dev, preview" >&2
          return 2
        fi
        MODE="$2"
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
      --host)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --host requires a value" >&2
          return 2
        fi
        HOST="$2"
        shift 2
        ;;
      --no-build)
        NO_BUILD="true"
        shift
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

#-----------------------------------------
# overview: enter the git repo root so all paths resolve correctly
#-----------------------------------------
enter_git_root() {
  local root
  root="$(git rev-parse --show-toplevel)"
  cd "$root"
}

#-----------------------------------------
# overview: find the first available port starting from START_PORT (5000),
#           checking with ss(8). Increments until a free one is found.
#
# @output: an available port number printed to stdout
# @return: 1 if no port found within 100 attempts, 0 otherwise
#-----------------------------------------
find_free_port() {
  local start="${1:-5000}"
  local port="$start"
  local attempts=0

  while [[ $attempts -lt 100 ]]; do
    if ! ss -tlnp 2>/dev/null | grep -q ":${port}[[:space:]]"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
    attempts=$((attempts + 1))
  done

  echo "error: could not find a free port after 100 attempts starting from $start" >&2
  return 1
}

#-----------------------------------------
# overview: decide the port to use. If PORT is already set (via --port), use it
#           directly after checking availability. Otherwise auto-allocate from 5000.
#
# @output: sets PORT global
# @return: 1 if the requested port is occupied, 0 otherwise
#-----------------------------------------
resolve_port() {
  if [[ -n "$PORT" ]]; then
    if ss -tlnp 2>/dev/null | grep -q ":${PORT}[[:space:]]"; then
      echo "error: port $PORT is already in use" >&2
      return 1
    fi
    return 0
  fi

  PORT="$(find_free_port 5000)"
}

#-----------------------------------------
# overview: run the build step for preview mode (builds the site first)
#-----------------------------------------
run_build() {
  if [[ "$MODE" != "preview" ]]; then
    return 0
  fi

  if [[ "$NO_BUILD" == "true" ]]; then
    return 0
  fi

  echo "Building $SITE site..."
  pnpm -F="$SITE" build
}

#-----------------------------------------
# overview: start the VitePress dev or preview server via the site's package.json
#           script, passing PORT as an environment variable. Runs in a new session
#           so it survives the parent script exiting.
#-----------------------------------------
start_server() {
  LOG_FILE="$(mktemp "/tmp/vitepress-preview-${SITE}-${MODE}-XXXXXX.log")"

  if [[ "$MODE" == "dev" ]]; then
    PORT="$PORT" pnpm -F="$SITE" exec vitepress dev --host "$HOST" --port "$PORT" > "$LOG_FILE" 2>&1 &
  else
    PORT="$PORT" pnpm -F="$SITE" exec vitepress preview --host "$HOST" --port "$PORT" > "$LOG_FILE" 2>&1 &
  fi

  PREVIEW_PID=$!
}

#-----------------------------------------
# overview: wait for the VitePress server to print its URL in the log file.
#           Scans for http://... patterns. Times out after MAX_WAIT seconds.
#
# @return: 0 when URL is found, 1 on timeout or error
#-----------------------------------------
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
      echo "error: server failed to start" >&2
      grep -E 'ELIFECYCLE|Command failed|Error:|fatal' "$LOG_FILE" | head -20 >&2
      return 1
    fi

    if ! kill -0 "$PREVIEW_PID" 2>/dev/null; then
      echo "error: server process exited unexpectedly" >&2
      tail -30 "$LOG_FILE" >&2
      return 1
    fi
  done

  echo "error: server did not start within ${MAX_WAIT}s" >&2
  tail -30 "$LOG_FILE" >&2
  return 1
}

#-----------------------------------------
# overview: resolve bind-address URLs to human-accessible display URLs.
#           When bound to 0.0.0.0, list each host IP separately so the user
#           can pick the right one.
#
# @output: sets DISPLAY_URLS global (comma-separated list)
#-----------------------------------------
resolve_display_urls() {
  local host_ips
  local actual_port

  # Extract the actual port from the server's own URL output, since the
  # underlying vitepress config may override the requested port.
  actual_port="$(echo "$PREVIEW_URL" | grep -oE ':[0-9]+/' | tr -d ':/')"
  if [[ -z "$actual_port" ]]; then
    actual_port="$PORT"
  fi

  if [[ "$HOST" == "0.0.0.0" || "$HOST" == "::" ]]; then
    host_ips="$(hostname -I 2>/dev/null || true)"
    if [[ -n "$host_ips" ]]; then
      DISPLAY_URLS="$(printf "%s\n" $host_ips | awk -v port="$actual_port" '{ print "http://" $1 ":" port "/" }' | paste -sd ',' - | sed 's/,/, /g')"
      return 0
    fi
  fi

  DISPLAY_URLS="$PREVIEW_URL"
}

#-----------------------------------------
# overview: print a summary table with preview details
#-----------------------------------------
print_summary() {
  local mode_label="dev (hot-reload)"
  if [[ "$MODE" == "preview" ]]; then
    mode_label="preview (production build)"
  fi

  local actual_port
  actual_port="$(echo "$PREVIEW_URL" | grep -oE ':[0-9]+/' | tr -d ':/')"
  if [[ -z "$actual_port" ]]; then
    actual_port="$PORT"
  fi

  cat <<EOF
| Item     | Result              |
|----------|---------------------|
| Site     | $SITE               |
| Mode     | $mode_label         |
| Port     | $actual_port        |
| URL      | $DISPLAY_URLS       |
| Log      | $LOG_FILE           |
| Cleanup  | Run post-PR cleanup when done |
EOF

  echo ""
  echo "Preview server is running. Open the URL above in a browser to view the site."
}

#-----------------------------------------
# overview: main entry point — parse args, allocate port, build if needed,
#           start server, wait for URL, print summary, and keep running.
#-----------------------------------------
main() {
  parse_args "$@"
  enter_git_root

  resolve_port
  run_build

  echo "Starting $MODE preview for '$SITE' on port $PORT..."

  start_server
  wait_for_preview
  resolve_display_urls

  print_summary

  wait "$PREVIEW_PID"
}

main "$@"
