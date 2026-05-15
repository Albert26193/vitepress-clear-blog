#!/usr/bin/env bash
#-----------------------------------------
# overview: fetch origin and rebase the current branch onto origin/master
#           before pushing. Ensures the branch is up-to-date with the
#           latest upstream changes and avoids non-fast-forward pushes.
#
# usage:   ./rebase-before-push.sh
#
# exit:    0 if rebase succeeded (or no new commits to rebase onto)
#          1 on conflict or other failure — caller must NOT push
#-----------------------------------------
set -euo pipefail

main() {
  local branch base
  branch="$(git branch --show-current)"
  base="origin/master"

  echo ">>> Fetching origin..."
  git fetch origin

  # Check if there are new commits on master that we need to rebase onto
  local behind
  behind="$(git rev-list --count "HEAD..${base}" 2>/dev/null || echo 0)"

  if [[ "${behind}" -eq 0 ]]; then
    echo ">>> Already up-to-date with ${base}; no rebase needed."
    return 0
  fi

  echo ">>> Branch is ${behind} commit(s) behind ${base}; rebasing..."
  if git rebase "${base}"; then
    echo ">>> Rebase succeeded."
    return 0
  else
    echo ""
    echo "!!! Rebase conflict detected. Resolve conflicts manually, then:"
    echo "    git rebase --continue"
    echo "    OR: git rebase --abort to cancel."
    return 1
  fi
}

main "$@"
