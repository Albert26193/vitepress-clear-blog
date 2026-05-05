#!/usr/bin/env bash
set -euo pipefail

# Shared helpers for tool-git-kanban scripts.

#-----------------------------------------
# overview: print an error message to stderr and exit non-zero
#
# @param: message  Human-readable error message
# @output: error message on stderr
# @return: exits with code 1
#-----------------------------------------
function die {
  local message="$1"
  printf 'error: %s\n' "$message" >&2
  exit 1
}

#-----------------------------------------
# overview: find the git repository root
#
# @output: absolute repository root path
# @return: 0 when inside a git repo; non-zero otherwise
#-----------------------------------------
function git_root {
  git rev-parse --show-toplevel
}

#-----------------------------------------
# overview: ensure gh is installed and authenticated with project scope
#
# @output: nothing on success
# @return: 0 when gh auth is usable; exits non-zero otherwise
#-----------------------------------------
function require_gh_project_auth {
  command -v gh >/dev/null 2>&1 || die "gh CLI is required"

  local status
  status="$(gh auth status 2>&1 || true)"
  if ! grep -q "Token scopes:.*project" <<<"$status"; then
    printf '%s\n' "$status" >&2
    die "gh token must include the project scope; run: gh auth refresh -s project"
  fi
}

#-----------------------------------------
# overview: print the absolute .ai_dev/issues directory path
#
# @output: absolute path to .ai_dev/issues
# @return: 0 when the directory exists; exits non-zero otherwise
#-----------------------------------------
function issues_dir {
  local root
  root="$(git_root)"
  local dir="$root/.ai_dev/issues"
  [[ -d "$dir" ]] || die ".ai_dev/issues does not exist at $dir"
  printf '%s\n' "$dir"
}

#-----------------------------------------
# overview: convert owner, repo, and issue number into a GitHub issue URL
#
# @param: owner  GitHub owner login
# @param: repo   GitHub repository name
# @param: number GitHub issue number
# @output: issue URL
# @return: 0 always
#-----------------------------------------
function issue_url_from_parts {
  local owner="$1"
  local repo="$2"
  local number="$3"
  printf 'https://github.com/%s/%s/issues/%s\n' "$owner" "$repo" "$number"
}

#-----------------------------------------
# overview: show script usage error
#
# @param: usage  Usage text
# @output: usage text on stderr
# @return: exits with code 2
#-----------------------------------------
function usage_error {
  local usage="$1"
  printf '%s\n' "$usage" >&2
  exit 2
}
