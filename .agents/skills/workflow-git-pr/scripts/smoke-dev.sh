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
DEV_PID=""

cleanup() {
  if [[ -n "${DEV_PID}" ]] && kill -0 "${DEV_PID}" 2>/dev/null; then
    kill "${DEV_PID}" 2>/dev/null || true
    wait "${DEV_PID}" 2>/dev/null || true
  fi
  rm -f "${LOG_FILE}"
}
trap cleanup EXIT

echo "Starting pnpm dev..."

# Start pnpm dev in background, capturing both stdout and stderr
pnpm dev > "${LOG_FILE}" 2>&1 &
DEV_PID=$!

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
