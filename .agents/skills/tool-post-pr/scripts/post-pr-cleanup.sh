#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="master"
KILL_MODE="kill"

#-----------------------------------------
# overview: print usage information for this cleanup script.
#
# @output: usage text printed to stdout
# @return: 0 always
#-----------------------------------------
function usage {
  cat <<'EOF'
Usage: post-pr-cleanup.sh [--base <branch>] [--no-kill] [--dry-run-kill]

Safely return to the base branch after PR work and clean repo-scoped dev/watch processes.

Options:
  --base <branch>   Base branch to switch to and pull. Default: master
  --no-kill         Skip process cleanup
  --dry-run-kill    List matching processes but do not terminate them
  -h, --help        Show this help
EOF
}

#-----------------------------------------
# overview: parse command-line options into global settings.
#
# @param:  $@  command-line arguments
# @return: 0 on success, 2 for invalid arguments
#-----------------------------------------
function parse_args {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --base)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "error: --base requires a branch name" >&2
          return 2
        fi
        BASE_BRANCH="$2"
        shift 2
        ;;
      --no-kill)
        KILL_MODE="none"
        shift
        ;;
      --dry-run-kill)
        KILL_MODE="dry-run"
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
# overview: find the repository root and switch to it.
#
# @output: repository root printed to stdout
# @return: 0 if inside a git repository, non-zero otherwise
#-----------------------------------------
function enter_git_root {
  local root
  root="$(git rev-parse --show-toplevel)"
  cd "$root"
  printf "%s" "$root"
}

#-----------------------------------------
# overview: detect whether git has an unfinished merge, rebase, cherry-pick, or revert.
#
# @param:  git_dir  path to .git directory
# @output: blocker name printed to stdout when present
# @return: 0 when no operation is in progress, 1 when blocked
#-----------------------------------------
function check_in_progress_operation {
  local git_dir="$1"
  if [[ -d "$git_dir/rebase-merge" || -d "$git_dir/rebase-apply" ]]; then
    echo "rebase"
    return 1
  fi
  if [[ -f "$git_dir/MERGE_HEAD" ]]; then
    echo "merge"
    return 1
  fi
  if [[ -f "$git_dir/CHERRY_PICK_HEAD" ]]; then
    echo "cherry-pick"
    return 1
  fi
  if [[ -f "$git_dir/REVERT_HEAD" ]]; then
    echo "revert"
    return 1
  fi
  return 0
}

#-----------------------------------------
# overview: refuse to continue when switching branches could hide or overwrite user work.
#
# @return: 0 when safe, 1 when the working tree or git operation is blocked
#-----------------------------------------
function ensure_safe_git_state {
  local git_dir operation status
  git_dir="$(git rev-parse --git-dir)"

  if ! operation="$(check_in_progress_operation "$git_dir")"; then
    echo "error: git has an in-progress $operation operation; finish or abort it before post-PR cleanup." >&2
    return 1
  fi

  status="$(git status --porcelain)"
  if [[ -n "$status" ]]; then
    echo "error: working tree is not clean; refusing to switch branches." >&2
    echo "$status" >&2
    return 1
  fi
}

#-----------------------------------------
# overview: fetch remote refs and switch to the requested base branch.
#
# @param:  base_branch  branch to switch to
# @output: status messages printed to stderr
# @return: 0 on success, non-zero if fetch or switch fails
#-----------------------------------------
function switch_to_base_branch {
  local base_branch="$1"
  git fetch origin "$base_branch" >&2

  if git show-ref --verify --quiet "refs/heads/$base_branch"; then
    git switch "$base_branch" >&2
  else
    git switch --track "origin/$base_branch" >&2
  fi
}

#-----------------------------------------
# overview: fast-forward pull the base branch without creating merge commits.
#
# @return: 0 on successful fast-forward or already up to date, non-zero otherwise
#-----------------------------------------
function pull_fast_forward {
  git pull --ff-only
}

#-----------------------------------------
# overview: determine whether the previous branch is merged into the current base.
#
# @param:  previous_branch  branch name used before switching to base
# @output: yes, no, or unknown printed to stdout
# @return: 0 always
#-----------------------------------------
function branch_merged_state {
  local previous_branch="$1"
  local pr_state merge_commit

  if [[ -z "$previous_branch" || "$previous_branch" == "$BASE_BRANCH" ]]; then
    echo "unknown"
    return 0
  fi
  if ! git show-ref --verify --quiet "refs/heads/$previous_branch"; then
    echo "unknown"
    return 0
  fi
  if git merge-base --is-ancestor "$previous_branch" HEAD; then
    echo "yes"
    return 0
  fi

  if command -v gh >/dev/null 2>&1; then
    pr_state="$(gh pr view "$previous_branch" --json state --jq '.state' 2>/dev/null || true)"
    if [[ "$pr_state" == "MERGED" ]]; then
      merge_commit="$(gh pr view "$previous_branch" --json mergeCommit --jq '.mergeCommit.oid // empty' 2>/dev/null || true)"
      if [[ -z "$merge_commit" ]] || git merge-base --is-ancestor "$merge_commit" HEAD; then
        echo "yes"
        return 0
      fi
    fi
  fi

  echo "no"
}

#-----------------------------------------
# overview: list repo-scoped dev/watch processes that are safe cleanup candidates.
#
# @param:  repo_root  absolute repository root path
# @output: tab-separated pid and command lines
# @return: 0 always
#-----------------------------------------
function list_cleanup_roots {
  local repo_root="$1"
  local repo_parent repo_name repo_prefix

  repo_parent="$(dirname "$repo_root")"
  repo_name="$(basename "$repo_root")"
  repo_prefix="${repo_name%-[0-9][0-9]}"

  printf "%s\n" "$repo_root"
  git worktree list --porcelain 2>/dev/null | awk '
    /^worktree / { print substr($0, 10) }
  ' | grep -Fvx "$repo_root" || true

  if [[ "$repo_prefix" != "$repo_name" ]]; then
    find "$repo_parent" -maxdepth 1 -type d -name "$repo_prefix-[0-9][0-9]" 2>/dev/null | grep -Fvx "$repo_root" || true
  fi
}

function cwd_is_cleanup_scoped {
  local cwd="$1"
  local roots="$2"
  local root

  while IFS= read -r root; do
    [[ -n "$root" ]] || continue
    [[ "$cwd" == "$root" || "$cwd" == "$root"/* ]] && return 0
  done <<< "$roots"

  return 1
}

function list_cleanup_candidates {
  local repo_root="$1"
  local pid stat args cwd roots

  roots="$(list_cleanup_roots "$repo_root")"

  ps -eo pid=,stat=,args= | while read -r pid stat args; do
    [[ -n "$pid" && -n "$stat" && -n "$args" ]] || continue
    [[ "$stat" != *Z* ]] || continue
    [[ "$args" =~ (build_preview\.sh|vitepress.*[[:space:]]+(dev|preview)|pnpm[^[:space:]]*.*(dev|preview:testbed|vitepress[[:space:]]+preview)|vite[[:space:]]+build[[:space:]]+--watch|tsup.*--watch|cpx.*-w|esbuild|playwright.*preview) ]] || continue
    [[ "$args" != *post-pr-cleanup.sh* && "$args" != *"/usr/bin/zsh -c"* ]] || continue

    cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
    cwd_is_cleanup_scoped "$cwd" "$roots" || continue

    printf "%s\t%s\n" "$pid" "$args"
  done
}

function pid_is_alive {
  local pid="$1"

  kill -0 "$pid" 2>/dev/null || return 1
  ! ps -o stat= -p "$pid" 2>/dev/null | grep -q Z
}

function wait_for_pids_to_exit {
  local pids="$1"
  local attempts=0
  local pid alive

  while [[ $attempts -lt 5 ]]; do
    alive=""
    for pid in $pids; do
      if pid_is_alive "$pid"; then
        alive+="$pid "
      fi
    done

    [[ -z "$alive" ]] && return 0
    sleep 1
    attempts=$((attempts + 1))
  done

  return 1
}

#-----------------------------------------
# overview: terminate repo-scoped dev/watch process candidates or show dry-run output.
#
# @param:  repo_root  absolute repository root path
# @param:  mode       kill, dry-run, or none
# @output: cleanup summary printed to stdout
# @return: 0 always
#-----------------------------------------
function cleanup_processes {
  local repo_root="$1"
  local mode="$2"
  local candidates count pids pgids remaining_pids killed_count pgid

  if [[ "$mode" == "none" ]]; then
    echo "process_cleanup=skipped"
    return 0
  fi

  candidates="$(list_cleanup_candidates "$repo_root" || true)"
  if [[ -z "$candidates" ]]; then
    echo "process_cleanup=none"
    return 0
  fi

  count="$(printf "%s\n" "$candidates" | wc -l | tr -d ' ')"
  echo "process_candidates=$count"
  printf "%s\n" "$candidates"

  pids="$(printf "%s\n" "$candidates" | cut -f1 | tr '\n' ' ')"

  if [[ "$mode" == "dry-run" ]]; then
    echo "process_cleanup=dry-run:$count pids=$pids"
    return 0
  fi

  pgids=""
  for pid in $pids; do
    pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
    [[ -n "$pgid" ]] || continue
    [[ " $pgids " == *" $pgid "* ]] || pgids+="$pgid "
  done

  for pgid in $pgids; do
    kill -TERM -- "-$pgid" 2>/dev/null || true
  done
  # shellcheck disable=SC2086
  kill -TERM $pids 2>/dev/null || true
  wait_for_pids_to_exit "$pids" || true

  remaining_pids=""
  for pid in $pids; do
    if pid_is_alive "$pid"; then
      remaining_pids+="$pid "
    fi
  done

  if [[ -n "$remaining_pids" ]]; then
    for pgid in $pgids; do
      kill -KILL -- "-$pgid" 2>/dev/null || true
    done
    # shellcheck disable=SC2086
    kill -KILL $remaining_pids 2>/dev/null || true
    wait_for_pids_to_exit "$pids" || true
  fi

  killed_count=0
  for pid in $pids; do
    if ! pid_is_alive "$pid"; then
      killed_count=$((killed_count + 1))
    fi
  done

  echo "process_cleanup=killed:$killed_count pids=$pids"
}

#-----------------------------------------
# overview: run the full post-PR cleanup workflow and print a compact report.
#
# @param:  $@  command-line arguments
# @return: 0 on success, non-zero on blocked git operations
#-----------------------------------------
function main {
  parse_args "$@"

  local repo_root previous_branch pull_output merged_state process_output
  repo_root="$(enter_git_root)"
  previous_branch="$(git branch --show-current)"

  ensure_safe_git_state
  switch_to_base_branch "$BASE_BRANCH"
  pull_output="$(pull_fast_forward 2>&1)"
  merged_state="$(branch_merged_state "$previous_branch")"
  process_output="$(cleanup_processes "$repo_root" "$KILL_MODE")"

  cat <<EOF
| Item | Result |
|---|---|
| Previous branch | \`$previous_branch\` |
| Current branch | \`$(git branch --show-current)\` |
| Pull | $(printf "%s" "$pull_output" | tail -1) |
| PR branch merged | $merged_state |
| Process cleanup | $(printf "%s" "$process_output" | tail -1) |
| Working tree | $(git status --short | grep -q . && echo dirty || echo clean) |
EOF
}

main "$@"
