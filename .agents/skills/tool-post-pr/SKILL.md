---
name: tool-post-pr
description: Use this skill whenever PR work is finished, a PR has been created or merged, or the user says post-pr, after PR, cleanup branch, switch back to master, pull latest, clean stale dev server, clean pnpm dev, or wants to reset the local repo after a PR. It safely returns to the base branch, checks for uncommitted work and conflict states before switching, fast-forward pulls the latest base, and cleans repository-scoped watcher/dev processes such as pnpm dev, VitePress, vite, tsup, cpx, esbuild, and Playwright preview leftovers.
---

# Post-PR Cleanup

Use this skill after finishing PR work: once a PR is created, merged, abandoned, or the user wants to return to normal development state. The goal is to leave the local repository on the base branch with the latest remote changes and no stale local dev/watch processes consuming ports or CPU.

## What this skill does

1. Inspect the current git state before changing branches.
2. Refuse to switch if there are uncommitted changes, staged changes, untracked files that look relevant, or an in-progress merge/rebase/cherry-pick.
3. Switch to the base branch, usually `master` for this repo.
4. Pull with `git pull --ff-only` so local history is never rewritten and merge commits are not created accidentally.
5. Confirm whether the just-finished PR branch is already merged into the base branch.
6. Clean stale repository-scoped dev/watch processes, especially `pnpm dev`, Vite/VitePress preview, `tsup --watch`, `cpx -w`, `esbuild`, and Playwright preview processes.
7. Report exactly what changed and what was left untouched.

## Safety rules

- Do not discard user work. If the working tree is dirty, stop and ask whether to commit, stash, or keep working.
- Do not use `git reset --hard`, `git clean`, force-delete branches, or force-push.
- Do not kill arbitrary system processes. Only terminate processes whose command line references the current repository path.
- Prefer `git pull --ff-only`; if it fails, report the reason instead of resolving automatically.
- If the base branch is not obvious, default to `master` in this repository. If another repo uses `main`, detect it from `origin/HEAD` or ask.

## Recommended workflow

Run the bundled script from the git root:

```bash
bash .agents/skills/tool-post-pr/scripts/post-pr-cleanup.sh
```

Optional arguments:

```bash
# Use a different base branch
bash .agents/skills/tool-post-pr/scripts/post-pr-cleanup.sh --base main

# Skip process cleanup
bash .agents/skills/tool-post-pr/scripts/post-pr-cleanup.sh --no-kill

# Show what would be killed without killing anything
bash .agents/skills/tool-post-pr/scripts/post-pr-cleanup.sh --dry-run-kill
```

## When the script stops

If the script refuses to proceed, handle the reported blocker first:

| Blocker | What to do |
|---|---|
| Dirty working tree | Review `git status --short`; commit/stash/remove only after user confirmation. |
| Merge/rebase in progress | Finish or abort the operation deliberately; do not hide it. |
| `git pull --ff-only` fails | Fetch and inspect divergence; ask before rebasing or merging. |
| Process cleanup cannot identify repo path | Do not kill processes manually unless the user confirms the exact PIDs. |

## Expected final report

Report in Chinese to this user, using a compact table:

```markdown
| Item | Result |
|---|---|
| Previous branch | `<branch>` |
| Current branch | `master` |
| Pull | Fast-forwarded / already up to date / failed with reason |
| PR branch merged | yes/no/unknown |
| Processes cleaned | `<count>` PIDs, or none |
| Working tree | clean / blocked |
```

Also mention any warnings, such as a PR branch that is not yet merged or a pull that could not fast-forward.
