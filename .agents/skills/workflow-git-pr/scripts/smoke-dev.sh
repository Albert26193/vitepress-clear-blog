#!/usr/bin/env bash
#-----------------------------------------
# overview: start pnpm dev, wait for the VitePress server to be ready,
#           report the startup status, then stop the dev process.
#
# @output: startup status printed to stdout — either a success table
#          or the captured error output
# @return: 0 if dev server started cleanly, 1 otherwise
#-----------------------------------------
set -euo pipefail

LOG_FILE="$(mktemp /tmp/pnpm-dev.XXXXXX.log)"
DEV_PGID=""

#-----------------------------------------
# overview: kill stale watchers left over from previous dev sessions.
#           Targets tsup, vite, cpx, and esbuild processes still referencing
#           this project directory.
#-----------------------------------------
pre_cleanup() {
  local before after killed
  before=$(ps aux | grep -cE "(vitepress dev|vite build --watch|tsup.*--watch|cpx.*-w)" 2>/dev/null || echo 0)
  if [[ "${before}" -eq 0 ]]; then
    return 0
  fi

  # Gather PIDs first, then kill — avoids pipefail interacting with
  # grep returning 1 when no match is found, and xargs running
  # kill without arguments when awk produces no output.
  local pids
  pids=$(ps aux | grep "vitepress-clear-blog" | grep -v grep | \
    grep -E "(pnpm|vite|tsup|cpx|vitepress|esbuild)" | \
    awk '{print $2}' || true)
  if [[ -n "${pids}" ]]; then
    echo "${pids}" | xargs kill -9 2>/dev/null || true
  fi

  after=$(ps aux | grep -cE "(vitepress dev|vite build --watch|tsup.*--watch|cpx.*-w)" 2>/dev/null || echo 0)
  killed=$((before - after))
  if [[ "${killed}" -gt 0 ]]; then
    echo "Pre-cleanup: killed ${killed} stale watcher(s) (${before} → ${after})"
  fi
}

cleanup() {
  if [[ -n "${DEV_PGID}" ]]; then
    # Kill the entire process group — pnpm dev spawns ~15-20 subprocesses
    # (tsup watchers, vite build watchers, cpx copiers, esbuild services)
    # and a plain kill on the top PID leaves orphans behind.
    kill -TERM -- -"${DEV_PGID}" 2>/dev/null || true
    sleep 1
    # Force-kill any processes that survived SIGTERM
    kill -KILL -- -"${DEV_PGID}" 2>/dev/null || true
    wait 2>/dev/null || true
  fi
  rm -f "${LOG_FILE}"
}
trap cleanup EXIT

echo "Checking for stale watchers..."
pre_cleanup

echo "Starting pnpm dev..."

# Start pnpm dev in background, capturing both stdout and stderr
pnpm dev > "${LOG_FILE}" 2>&1 &
DEV_PID=$!
DEV_PGID=$(ps -o pgid= -p "${DEV_PID}" 2>/dev/null | tr -d ' ')

# Wait up to 60 seconds for the VitePress dev server to signal readiness.
# VitePress prints "ready in" (or "⠏ building") and then the local URL.
MAX_WAIT=60
ELAPSED=0
READY=0
VITEPRESS_URL=""

while [[ ${ELAPSED} -lt ${MAX_WAIT} ]]; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))

  # Look for VitePress dev server URL in the log
  if grep -qE 'http://localhost:[0-9]+' "${LOG_FILE}" 2>/dev/null; then
    VITEPRESS_URL="$(grep -oE 'http://localhost:[0-9]+' "${LOG_FILE}" | tail -1)"
    READY=1
    break
  fi

  # Check for fatal errors early
  if grep -qE 'ELIFECYCLE|Command failed|fatal|Error:' "${LOG_FILE}" 2>/dev/null; then
    echo ""
    echo "Dev server failed to start:"
    echo "---"
    grep -E 'ELIFECYCLE|Command failed|Error:|fatal' "${LOG_FILE}" | head -20
    exit 1
  fi

  # Check if process died
  if ! kill -0 "${DEV_PID}" 2>/dev/null; then
    echo ""
    echo "Dev process exited unexpectedly (PID ${DEV_PID}). Last output:"
    echo "---"
    tail -30 "${LOG_FILE}"
    exit 1
  fi
done

if [[ ${READY} -eq 0 ]]; then
  echo ""
  echo "Dev server did not start within ${MAX_WAIT}s. Last output:"
  echo "---"
  tail -30 "${LOG_FILE}"
  exit 1
fi

echo ""
echo "Dev server started successfully:"
echo "| Item | Status |"
echo "|------|--------|"
echo "| VitePress URL | ${VITEPRESS_URL} |"
echo "| Startup time | ${ELAPSED}s |"
echo "| Log file | ${LOG_FILE} |"
echo ""

# Show any warnings
if grep -qi 'warn\|deprecated' "${LOG_FILE}" 2>/dev/null; then
  echo "Warnings:"
  grep -i 'warn\|deprecated' "${LOG_FILE}" | head -10
  echo ""
fi

exit 0
