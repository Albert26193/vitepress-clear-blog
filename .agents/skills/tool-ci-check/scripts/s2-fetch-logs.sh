#!/bin/bash
# =============================================================================
# s2-fetch-logs.sh
# Fetch all GitHub Actions job logs for a workflow run and persist them to
# .ai_dev/<branch>/ci/build-<id>-ts-<time>/logs/
#
# Usage:
#   ./s2-fetch-logs.sh <branch> [run_id]
#   ./s2-fetch-logs.sh issue-6-ci-cd-pipeline-fix-tests
#   ./s2-fetch-logs.sh issue-6-ci-cd-pipeline-fix-tests 25254392974
#
# When run_id is omitted, the latest run on the branch is used.
#
# Output (JSON to stdout):
#   {"ci_dir":"<abs-path>","run_id":"...","created_at":"...","status":"...","conclusion":"...","jobs_count":4}
#
# Directory structure created:
#   .ai_dev/<branch>/ci/build-<id>-ts-<time>/
#     logs/
#       job-name.log  (kebab-case, one per job)
#     summary.json
#
# Requires: gh CLI with auth, git, jq
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_check-auth.sh
. "${SCRIPT_DIR}/_check-auth.sh"

BRANCH="${1:-}"
EXPLICIT_RUN_ID="${2:-}"

if [[ -z "${BRANCH}" ]]; then
  echo '{"error":"missing required argument: branch"}' >&2
  echo 'usage: s2-fetch-logs.sh <branch> [run_id]' >&2
  exit 1
fi

# --------------------------------------------------------------------------
# sanitize_name --- convert a GitHub job name to a safe kebab-case filename
#
#   "Type Check" → "type-check"
#   "Build (linux)" → "build-linux"
#
# @param: $1  raw job name
# @output: sanitized filename (without extension)
# --------------------------------------------------------------------------
sanitize_name() {
  printf '%s' "${1}" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9]\+/-/g' \
    | sed 's/^-//;s/-$//'
}

# --------------------------------------------------------------------------
# resolve_run_id --- get the latest run id if none was given
#
# @param: $1  branch
# @param: $2  explicit run_id (optional)
# @output: run_id printed to stdout
# @return: 0, or 1 if no runs found
# --------------------------------------------------------------------------
resolve_run_id() {
  local branch="${1}"
  local explicit="${2}"

  if [[ -n "${explicit}" ]]; then
    printf '%s' "${explicit}"
    return 0
  fi

  local latest
  latest="$(gh run list --branch "${branch}" --limit 1 --json databaseId --jq '.[0].databaseId // ""' 2>/dev/null)" || true

  if [[ -z "${latest}" ]]; then
    echo "No CI runs found for branch '${branch}'" >&2
    exit 1
  fi

  printf '%s' "${latest}"
}

# --------------------------------------------------------------------------
# derive_timestamp --- convert ISO 8601 to compact format for directory naming
#
# @param: $1  ISO 8601 date string (e.g. 2026-05-02T14:28:16Z)
# @output: compact timestamp (e.g. 20260502T142816Z)
# --------------------------------------------------------------------------
derive_timestamp() {
  printf '%s' "${1}" | sed 's/[:-]//g'
}

# --------------------------------------------------------------------------
# build_ci_dir --- construct the absolute path to the CI persistence directory
#
# @param: $1  git root
# @param: $2  branch name
# @param: $3  run id
# @param: $4  compact timestamp
# @output: absolute directory path
# --------------------------------------------------------------------------
build_ci_dir() {
  local git_root="${1}"
  local branch="${2}"
  local run_id="${3}"
  local ts="${4}"
  printf '%s/.ai_dev/%s/ci/build-%s-ts-%s' "${git_root}" "${branch}" "${run_id}" "${ts}"
}

# --------------------------------------------------------------------------
# fetch_one_log --- download a single job log (guarded against set -e)
#
#   If gh fails, writes a FAILED placeholder to the log file so the job
#   is not silently missing and subsequent jobs still execute.
#
# @param: $1  run_id
# @param: $2  job_id (databaseId)
# @param: $3  log file path
# @param: $4  job name (for the failure message)
# --------------------------------------------------------------------------
fetch_one_log() {
  local run_id="${1}"
  local job_id="${2}"
  local log_path="${3}"
  local job_name="${4}"

  if gh run view "${run_id}" --log --job "${job_id}" > "${log_path}" 2>/dev/null; then
    return 0
  fi

  echo "FAILED to fetch log for ${job_name} (job_id=${job_id})" > "${log_path}"
  return 0
}

# --------------------------------------------------------------------------
# fetch_logs --- download all job logs for a run
#
#   Uses process substitution (not a pipe) so the loop runs in the current
#   shell — set -e and variable updates work as expected.
#
# @param: $1  run_id
# @param: $2  logs directory path
# @param: $3  jobs JSON array (from gh run view --json jobs)
# --------------------------------------------------------------------------
fetch_logs() {
  local run_id="${1}"
  local logs_dir="${2}"
  local jobs_json="${3}"

  local job_count
  job_count="$(echo "${jobs_json}" | jq 'length')"

  echo "Fetching ${job_count} job log(s) for run ${run_id}..." >&2

  while read -r job; do
    local job_name job_id safe_name log_path
    job_name="$(echo "${job}" | jq -r '.name')"
    job_id="$(echo "${job}" | jq -r '.databaseId')"
    safe_name="$(sanitize_name "${job_name}")"
    log_path="${logs_dir}/${safe_name}.log"

    printf '  -> %s (%s)...' "${job_name}" "${job_id}" >&2
    fetch_one_log "${run_id}" "${job_id}" "${log_path}" "${job_name}"
    printf ' ok\n' >&2
  done < <(echo "${jobs_json}" | jq -c '.[]')
}

# --------------------------------------------------------------------------
# write_summary --- write summary.json to the ci directory
#
#   Job names are enriched with their sanitized filename so s3 doesn't need
#   to recompute the mapping.
#
# @param: $1  ci_dir
# @param: $2  run_json (from gh run view)
# --------------------------------------------------------------------------
write_summary() {
  local ci_dir="${1}"
  local run_json="${2}"

  echo "${run_json}" | jq '{
    run_id:       .databaseId,
    displayTitle: .displayTitle,
    status:       .status,
    conclusion:   .conclusion,
    created_at:   .createdAt,
    event:        .event,
    headBranch:   .headBranch,
    url:          .url,
    workflowName: .workflowName,
    jobs: [.jobs[] | {
      name:       .name,
      safeName:   (.name | ascii_downcase | gsub("[^a-z0-9]+";"-") | sub("^-";"") | sub("-$";"")),
      status:     .status,
      conclusion: .conclusion,
      databaseId: .databaseId,
      url:        .url
    }]
  }' > "${ci_dir}/summary.json"
}

# =============================================================================
# main
# =============================================================================

check_auth

RUN_ID="$(resolve_run_id "${BRANCH}" "${EXPLICIT_RUN_ID}")"
RUN_JSON="$(gh run view "${RUN_ID}" --json databaseId,createdAt,jobs,status,conclusion,displayTitle,event,headBranch,url,workflowName)"

GIT_ROOT="$(git rev-parse --show-toplevel)"
CREATED_AT="$(echo "${RUN_JSON}" | jq -r '.createdAt')"
TS="$(derive_timestamp "${CREATED_AT}")"
CI_DIR="$(build_ci_dir "${GIT_ROOT}" "${BRANCH}" "${RUN_ID}" "${TS}")"
LOGS_DIR="${CI_DIR}/logs"

mkdir -p "${LOGS_DIR}"

JOBS_JSON="$(echo "${RUN_JSON}" | jq '.jobs')"
fetch_logs "${RUN_ID}" "${LOGS_DIR}" "${JOBS_JSON}"

write_summary "${CI_DIR}" "${RUN_JSON}"

JOBS_COUNT="$(echo "${JOBS_JSON}" | jq 'length')"
STATUS="$(echo "${RUN_JSON}" | jq -r '.status')"
CONCLUSION="$(echo "${RUN_JSON}" | jq -r '.conclusion')"

printf '{"ci_dir":"%s","run_id":"%s","created_at":"%s","status":"%s","conclusion":"%s","jobs_count":%s}\n' \
  "${CI_DIR}" "${RUN_ID}" "${CREATED_AT}" "${STATUS}" "${CONCLUSION}" "${JOBS_COUNT}"
