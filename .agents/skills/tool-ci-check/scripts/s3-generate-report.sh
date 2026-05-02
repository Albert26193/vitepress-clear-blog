#!/bin/bash
# =============================================================================
# s3-generate-report.sh
# Read summary.json + log files, fill the template from assets/report-template.md
# with sed (scalars) + sed 'r' (multi-line blocks).
#
# Failed jobs get a Troubleshooting section with grep -n -C 10 -i output so
# line numbers are visible.  The agent uses these to Read into the full log.
#
# Usage:
#   ./s3-generate-report.sh <ci_dir>
#
# Output: path to the generated report.md (stdout)
# Writes:  <ci_dir>/report.md
#
# Requires: jq, grep, sed
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "${SCRIPT_DIR}")"
TEMPLATE="${SKILL_DIR}/assets/report-template.md"

# shellcheck source=./_check-auth.sh
. "${SCRIPT_DIR}/_check-auth.sh"

CI_DIR="${1:-}"

if [[ -z "${CI_DIR}" ]]; then
  echo '{"error":"missing required argument: ci_dir"}' >&2
  echo 'usage: s3-generate-report.sh <ci_dir>' >&2
  exit 1
fi

if [[ ! -f "${TEMPLATE}" ]]; then
  echo "Template not found at ${TEMPLATE}" >&2
  exit 1
fi

SUMMARY="${CI_DIR}/summary.json"
LOGS_DIR="${CI_DIR}/logs"
REPORT="${CI_DIR}/report.md"

if [[ ! -f "${SUMMARY}" ]]; then
  echo "summary.json not found at ${SUMMARY}" >&2
  exit 1
fi

# --------------------------------------------------------------------------
# escape_sed --- escape \, &, and the chosen delimiter in a value
#
#   sed 's' command interprets \, &, and the delimiter character.
#   We use @ as delimiter because it is unlikely in CI titles/URLs.
#
# @param: $1  raw value
# @output: escaped value (stdout)
# --------------------------------------------------------------------------
escape_sed() {
  printf '%s' "${1}" | sed 's/[@\\&]/\\&/g'
}

# --------------------------------------------------------------------------
# inject_multiline --- replace a single-line placeholder with file content
#
#   Uses sed '/pattern/r file' to insert content after the placeholder line,
#   then deletes the placeholder line.
#
# @param: $1  placeholder pattern (e.g. __JOB_TABLE__)
# @param: $2  file whose content to insert
# @param: $3  target report file
# --------------------------------------------------------------------------
inject_multiline() {
  local placeholder="${1}"
  local src_file="${2}"
  local target="${3}"

  sed -i "/^${placeholder}$/r ${src_file}" "${target}"
  sed -i "/^${placeholder}$/d"       "${target}"
}

# --------------------------------------------------------------------------
# build_job_table --- generate markdown table rows from summary.json jobs
#
# @output: markdown table (header + rows)
# --------------------------------------------------------------------------
build_job_table() {
  echo '| Job | Status | Conclusion |'
  echo '|-----|--------|------------|'
  jq -r '.jobs[] | "| `\(.name)` | \(.status) | \(.conclusion) |"' "${SUMMARY}"
}

# --------------------------------------------------------------------------
# build_log_links --- generate markdown links to kebab-case log files
#
#   Uses safeName from summary.json (pre-computed by s2).
#
# @output: markdown table (header + rows)
# --------------------------------------------------------------------------
build_log_links() {
  echo '| Job | Log |'
  echo '|-----|-----|'
  jq -r '.jobs[] | "| \(.name) | [\(.safeName).log](./logs/\(.safeName).log) |"' "${SUMMARY}"
}

# --------------------------------------------------------------------------
# build_troubleshooting --- grep failed job logs for error signatures
#
#   Uses process substitution so the while loop runs in the current shell
#   and line_count takes effect.
#
#   For each failed job, greps its log with -n -C 10 -i for error patterns.
#   Line numbers let the agent Read directly into the relevant section.
#   Output capped at ~120 lines.
#
# @output: markdown with grep blocks per failed job
# --------------------------------------------------------------------------
build_troubleshooting() {
  local -r ERROR_RE='##\[(error|warning)\]|error[ :]|exit code [1-9]|command not found|ERR_|DTS.*Build error|Build failed|process completed with exit code'

  local failed_jobs
  failed_jobs="$(jq -r '.jobs[] | select(.conclusion | ascii_downcase == "failure") | .name' "${SUMMARY}")"

  if [[ -z "${failed_jobs}" ]]; then
    echo '_All jobs passed — nothing to troubleshoot._'
    return 0
  fi

  local line_count=0
  local max_lines=120

  while read -r job_name; do
    local safe_name
    safe_name="$(jq -r --arg name "${job_name}" '.jobs[] | select(.name == $name) | .safeName' "${SUMMARY}")"
    local log_path="${LOGS_DIR}/${safe_name}.log"

    echo ""
    echo "### ${job_name}"
    echo ""
    echo "[Full log](./logs/${safe_name}.log)"
    echo ""

    if [[ ! -f "${log_path}" ]]; then
      echo '_Log file not found._'
      continue
    fi

    local hits
    hits="$(grep -n -C 10 -i -E "${ERROR_RE}" "${log_path}" 2>/dev/null || true)"

    if [[ -z "${hits}" ]]; then
      echo '```'
      echo "--- (no error patterns matched, showing last 20 lines) ---"
      tail -n 20 "${log_path}"
      echo '```'
    else
      echo '```'
      printf '%s\n' "${hits}"
      echo '```'
    fi

    local block_lines
    block_lines="$(printf '%s\n' "${hits}" | wc -l)"
    line_count=$((line_count + block_lines + 10))
    if [[ ${line_count} -gt ${max_lines} ]]; then
      echo ""
      echo "_Troubleshooting section capped at ${max_lines} lines. See full logs for remaining details._"
      break
    fi
  done < <(echo "${failed_jobs}")
}

# =============================================================================
# main
# =============================================================================

check_auth

# --- Scalar values ---
RUN_ID="$(jq -r '.run_id' "${SUMMARY}")"
TITLE="$(jq -r '.displayTitle' "${SUMMARY}")"
CONCLUSION="$(jq -r '.conclusion' "${SUMMARY}" | tr '[:upper:]' '[:lower:]')"
CREATED="$(jq -r '.created_at' "${SUMMARY}")"
URL="$(jq -r '.url // ""' "${SUMMARY}")"
EVENT="$(jq -r '.event // ""' "${SUMMARY}")"
TOTAL="$(jq '.jobs | length' "${SUMMARY}")"
PASSED="$(jq '[.jobs[] | select(.conclusion | ascii_downcase == "success")] | length' "${SUMMARY}")"
FAILED="$(jq '[.jobs[] | select(.conclusion | ascii_downcase == "failure")] | length' "${SUMMARY}")"
SKIPPED="$(jq '[.jobs[] | select(.conclusion | ascii_downcase == "skipped" or . == "cancelled")] | length' "${SUMMARY}")"

# Build OTHER suffix (e.g. ", 1 skipped")
OTHER=""
if [[ "${SKIPPED}" -gt 0 ]]; then
  OTHER=", ${SKIPPED} skipped/cancelled"
fi

# --- Multi-line blocks ---
JOB_TABLE_FILE="${CI_DIR}/.job_table.tmp"
LOG_LINKS_FILE="${CI_DIR}/.log_links.tmp"
TROUBLESHOOTING_FILE="${CI_DIR}/.troubleshooting.tmp"

build_job_table         > "${JOB_TABLE_FILE}"
build_log_links         > "${LOG_LINKS_FILE}"
build_troubleshooting   > "${TROUBLESHOOTING_FILE}"

# --- Compose report ---
cp "${TEMPLATE}" "${REPORT}"

# Scalar placeholders (sed with @ delimiter, values escaped)
sed -i "s@__RUN_ID__@$(escape_sed "${RUN_ID}")@g"             "${REPORT}"
sed -i "s@__TITLE__@$(escape_sed "${TITLE}")@g"               "${REPORT}"
sed -i "s@__EVENT__@$(escape_sed "${EVENT}")@g"               "${REPORT}"
sed -i "s@__CREATED__@$(escape_sed "${CREATED}")@g"           "${REPORT}"
sed -i "s@__CONCLUSION__@$(escape_sed "${CONCLUSION}")@g"     "${REPORT}"
sed -i "s@__URL__@$(escape_sed "${URL}")@g"                   "${REPORT}"
sed -i "s@__PASSED__@$(escape_sed "${PASSED}")@g"             "${REPORT}"
sed -i "s@__FAILED__@$(escape_sed "${FAILED}")@g"             "${REPORT}"
sed -i "s@__TOTAL__@$(escape_sed "${TOTAL}")@g"               "${REPORT}"
sed -i "s@__OTHER__@$(escape_sed "${OTHER}")@g"               "${REPORT}"

# Multi-line placeholders (sed 'r' file → delete placeholder)
inject_multiline '__JOB_TABLE__'       "${JOB_TABLE_FILE}"       "${REPORT}"
inject_multiline '__LOG_LINKS__'       "${LOG_LINKS_FILE}"       "${REPORT}"
inject_multiline '__TROUBLESHOOTING__' "${TROUBLESHOOTING_FILE}" "${REPORT}"

rm -f "${JOB_TABLE_FILE}" "${LOG_LINKS_FILE}" "${TROUBLESHOOTING_FILE}"

printf '%s\n' "${REPORT}"
