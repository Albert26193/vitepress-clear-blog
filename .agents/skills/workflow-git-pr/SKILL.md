---
name: workflow-git-pr
description: Full git workflow from unstaged changes to a merged PR. Use this skill whenever the user wants to turn current changes into a GitHub issue, proper branch, commit, quality gate, and pull request — especially when they say things like "提交并提 PR", "create an issue and PR for these changes", "按照改动建 issue 提 pr", "push these changes with a proper issue", or any request that involves creating an issue and PR from working-tree changes. This skill orchestrates the tool-git-issues, tool-git-commit, tool-test-check, and CI skills into a single workflow, and it must bring in std-antfu-vue when PR changes touch Vue SFCs, theme Vue components, NewLayout.vue, Composition API, props/emits, composables, or Vue UI refactors.
---

# Git Issue-to-PR Workflow

**First, set the anchor**: all script paths in this skill are relative to the
skill directory. Set this once before any step:

```bash
SKILL_DIR=".agents/skills/workflow-git-pr"
```

Every script invocation below uses `bash "$SKILL_DIR/scripts/..."` so the
commands work regardless of the current working directory.

---

Orchestrates the complete path from unstaged changes to a PR with all CI
checks passing. This skill delegates the specialized steps — issue creation,
commit message generation, local quality gate, build preview, and CI
verification — to `tool-git-issues`, `tool-git-commit`, `tool-test-check`,
`tool-pnpm`, and `tool-ci-check` rather than duplicating their logic.

## Skill delegation

| Step | Delegates to | What it does |
|------|-------------|--------------|
| Analyze + create issue | **tool-git-issues** | Reads templates, picks type/labels, crafts title+body, calls `gh api` |
| Analyze + write commit | **tool-git-commit** | Gathers context, determines type/scope, writes Conventional Commits message, validates with checker |
| Vue coding standard | **std-antfu-vue** | Required when changes touch Vue SFCs, theme Vue components, `NewLayout.vue`, Composition API, props/emits, composables, or Vue UI refactors |
| Pre-PR quality gate | **tool-test-check** | Runs the local/CI-aligned quality checks and blocks PR creation on failures |
| Build preview | **tool-pnpm** | Runs `build_preview.sh` so humans inspect built VitePress output, not watcher-based `pnpm dev` |
| Post-PR CI verification | **tool-ci-check** | Detects PR, polls CI status, fetches all job logs, generates report; blocks final report until all CI jobs pass |
| Everything else | This skill | Auth check, branch naming, staging, git operations, push, PR creation |

## Two Hard Rules

1. **Branch naming**: `issue-<id>-<slug>` — the ID comes from the issue created
   in step 2, the slug is 3-6 words derived from the issue title in kebab-case.
   Never use `feat/`, `fix/`, `feature/`, or any other prefix. Examples:
   - `issue-3-ai-agent-tooling`
   - `issue-12-fix-codeblock-fold-firefox`
   - `issue-47-add-theme-dark-mode-toggle`

2. **Single squashed commit**: All changes go into exactly one commit. If the
   branch already has WIP commits, reset them before committing. The commit
   message must reference the issue number.

## Entry point detection + issue matching

Before diving into the workflow, we need to answer two questions:

1. **Is there a candidate issue** — from the branch name or the user's prompt?
2. **If so, does the issue match the current changes** — or is it a different piece of work?

Only a **matched** issue lets us skip the issue-creation step. A stale or
unrelated issue reference must not be used blindly.

### Step 0a: Find a candidate issue ID

Check these sources in order:

| Source | How to detect | Example |
|--------|--------------|---------|
| **Branch name** | `git branch --show-current` matches `issue-<id>-*` | `issue-3-ai-agent-tooling` → extract `3` |
| **User prompt** | Human says `#<N>`, `issue <N>`, `for issue <N>`, `closes #<N>` | "提交到 issue 5" → extract `5` |

If no candidate is found → **path A (full workflow)**. Skip the matching logic
below and go straight to Step 2 (create a new issue).

### Step 0b: Validate the candidate — does the issue match the diff?

When a candidate ID is found, **fetch the issue and compare it against the
actual changes**. Do not assume a match just because the name looks right.

```bash
# Fetch the issue content
gh issue view <id> --json title,body,labels --jq '{title, body, labels: [.labels[].name]}'

# Read the current diff summary
git diff --stat
git diff --cached --stat
```

Now compare along these dimensions:

| Dimension | Check | Mismatch signal |
|-----------|-------|-----------------|
| **Files changed** | Do the paths in `git diff --stat` relate to the issue's `package:` label? | Issue tagged `package:theme` but diff is only in `packages/docs/` |
| **Change nature** | Does `git diff` look like what the issue describes? | Issue says "add dark mode" but diff is fixing a typo in README |
| **Scope** | Is the magnitude of changes consistent with the issue? | Issue is a small bug fix but diff shows 80 new files |

Use judgment — an exact keyword match isn't required, but the changes should
clearly relate to the issue's stated purpose.

### Step 0c: Decision — match or mismatch?

#### Match → mirror the issue downstream

The issue accurately describes these changes. Use it to drive the rest of the
workflow:

- **Skip Step 2** (no need to create a new issue)
- **Step 3**: Derive the branch slug from the issue title
- **Step 4**: Reference `#<N>` in the commit message
- **Step 5**: Include `Closes #<N>` in the PR body

If the current branch already matches `issue-<id>-*` and the slug is correct,
also **skip Step 3** (branch already exists).

#### Mismatch → surface the conflict and ask

When the issue doesn't match the diff, present the evidence clearly and let the
user decide:

```
⚠️  Issue #<N> ("<title>") doesn't seem to match the current changes:

  Issue describes: <summary from issue body>
  Current diff:    <summary from git diff>

  Changed files:   <key paths from diff --stat>
  Issue package:    <package label from issue>

What would you like to do?
  A) Proceed anyway — link these changes to issue #<N>
  B) Create a new issue instead — start fresh
  C) Let me specify a different issue number
```

Do not proceed until the user answers. Never silently link mismatched changes.

### Decision flow summary

```
Candidate issue found?
├─ No  → PATH A: Full workflow (create issue → branch → commit → PR)
└─ Yes → Fetch issue content
    ├─ Match  → PATH M: Mirror issue downstream
    │   ├─ Branch is issue-<id>-*? → skip Step 3 too
    │   └─ Branch is something else → create issue-<id>-<slug> in Step 3
    └─ Mismatch → Ask user → follow their choice
```

## Workflow

### Step 0: Pre-flight

Check gh auth first:

```bash
gh auth status 2>&1
```

If not authenticated, stop and tell the user to run `gh auth login` or provide
a `GH_TOKEN`. Do not proceed without auth.

Check there are changes to commit:

```bash
git status
git diff --stat
git diff --cached --stat
```

If nothing is modified, stop and tell the user.

Install dependencies to ensure workspace packages are built and resolvable:

```bash
pnpm install
```

Run the **entry point detection** (see "Entry point detection" above). Use the
bundled script:

```bash
bash "$SKILL_DIR/scripts/detect-entry.sh"
```

This outputs JSON with `entry` ("A" or "M"), `issue_id`, `branch_ok`, and
`current_branch`. Use `entry` to decide which steps to skip.

### Step 1: Analyze changes

Run the diff analysis script to get structured metadata:

```bash
bash "$SKILL_DIR/scripts/analyze-diff.sh"
```

This outputs JSON with `scope`, `package_label`, `changed_files`, `packages`, and
`suggested_type`. The LLM should review `suggested_type` and override it if the
context warrants (e.g., a `fix` tag on what is clearly a `feat`).

The script handles the scope/package-label mapping for all known packages in this
monorepo. Root-level file changes produce `scope: null` and `package_label: "package:root"`.

#### Step 1a: Vue changes → invoke `std-antfu-vue`

After diff analysis, inspect the changed file list and diff. If any current
change touches Vue SFCs or Vue architecture, invoke **std-antfu-vue** before
creating the issue, writing commit text, or running quality gates.

Trigger this delegation for any of these signals:

- `*.vue` files, especially under `packages/theme/src/components/`
- `packages/theme/src/components/NewLayout.vue`
- Vue Composition API logic (`ref`, `computed`, `watch`, `watchEffect`, lifecycle hooks)
- props/emits/model contracts, slots, provide/inject, or component data flow
- composables under `packages/theme/src/composables/`
- route/page/layout/sidebar/navigation UI behavior
- Vue component refactors or component boundary decisions

Pass `std-antfu-vue` the changed paths and a short diff summary. Use its guidance
for component boundaries, composables, Vue data flow, and E2E expectations while
preserving this workflow's issue, branch, commit, and PR rules.

Do not invoke `std-antfu-vue` for non-Vue-only changes such as Markdown docs,
package metadata, CI config, or Node-only plugin code unless the diff also affects
Vue UI behavior.

### Step 2: Create the issue — invoke `tool-git-issues` → PATH A only

**Only run this step for PATH A** (no candidate issue, or user chose "create new"
after a mismatch).

**Language**: All issue titles and bodies MUST be written in English. The
tool-git-issues skill enforces this requirement — see its "Language" section.

Invoke the **tool-git-issues** skill to handle issue creation. Pass it the
analysis from step 1 (scope, package label, change summary from diffs).

The tool-git-issues skill will:
- Select the correct template (`feature-bug.md`, `task.md`, etc.) from its assets/
- Determine the GitHub issue type (Feature, Bug, Task)
- Map the scope to the correct `package:` label
- Craft the title (< 72 chars, English) and body (Description, Acceptance Criteria, Notes — all English)
- Call `gh api repos/{owner}/{repo}/issues -X POST` with the right flags
- Return the issue number and URL

**Critical**: After tool-git-issues returns, capture the issue number — it's
needed for the branch name (step 3) and commit message (step 4).

For PATH M, the issue number was validated in Step 0b. Fetch its title for the
branch slug (step 3):

```bash
gh issue view <N> --json title --jq '.title'
```

### Step 3: Create the branch → skip if already on `issue-<id>-*`

**Only run this step when the current branch does NOT match `issue-<id>-*`.**

The bundled script derives the slug from the issue title (strips stop-words,
limits to 6 meaningful words, kebab-cases) and creates the branch:

```bash
branch="$(bash "$SKILL_DIR/scripts/create-branch.sh" \
  --issue-id <N> \
  --title "$(gh issue view <N> --json title --jq '.title')")"
echo "Created branch: $branch"
```

The script handles:
- Stop-word filtering ("a", "the", "for", "add", "support", etc.)
- Sluggification (lowercase, kebab-case)
- `git checkout -b` with uncommitted changes carried over

If the current branch already matches — skip this step.

### Step 4: Stage, lint, and write commit message — invoke `tool-git-commit`

Stage everything:

```bash
git add <specific-files-and-directories>
```

Prefer explicit paths over `git add -A` or `git add .`. Never stage `.env`,
credentials, or large binaries.

Run lint to auto-fix formatting before committing:

```bash
pnpm lint
```

After lint auto-fixes, re-stage the same files to capture any corrections:

```bash
git add <same-specific-files>
```

This ensures the commit contains clean, formatted code. The `pnpm lint` command
runs `eslint --fix` which auto-corrects fixable issues in place.

**Invoke the tool-git-commit skill** to generate the commit message. Pass it:
- The issue number (from step 2 or from detection)
- The branch name `issue-<id>-<slug>` (the skill will extract the ID)
- The scope from step 1

The tool-git-commit skill will:
- Gather full diff context (`git diff --cached`, `git diff --cached --stat`)
- Find the merge base and recent commit history
- Determine the Conventional Commits type and scope
- Generate a properly formatted message with `DESC` block (code:, test:, summarize:)
- Run its bundled checker script to validate
- Output the final message with `Co-Authored-By` footer

**If the branch already has commits** (e.g., WIP commits from earlier work),
squash everything into one before committing. The procedure:

```bash
# Ensure we have the latest base ref before computing the merge base
git fetch origin master

# Find the merge base (where this branch diverged from master)
MERGE_BASE="$(git merge-base origin/master HEAD)"

# Stage all current changes on top of the existing commits
git add <specific-files>

# Soft-reset to the merge base — keeps ALL changes staged in the index
git reset --soft "$MERGE_BASE"

# Run lint to auto-fix formatting on the squashed changes
pnpm lint

# Re-stage after lint fixes
git add <specific-files>
```

After this, the branch has zero commits and all changes are staged (and
formatted), ready for a single clean `git commit`.

Once tool-git-commit returns the validated message, commit it:

```bash
git commit -m "$(cat <<'EOF'
<message from tool-git-commit>
EOF
)"
```

### Step 5: Quality gate — invoke `tool-test-check`

Before pushing or creating a PR, invoke the **tool-test-check** skill as a
blocking quality gate. This step must pass before continuing to PR creation.

Ask `tool-test-check` to run the PR/CI-aligned local gate for the staged commit:

- `pnpm lint; git diff --exit-code`
- `bash scripts/check-e2e-coverage.sh`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm build`
- related E2E specs for the current changes, not naked full `pnpm test:e2e`

Use `tool-test-check`'s E2E selection rules to choose the related cases. Only run
full local E2E if the user explicitly requested it or if the changes are broad
enough that targeted cases would be misleading.

If the quality gate passes, continue to Step 6.

If any quality gate check fails:

1. Stop before push/PR creation.
2. Diagnose and fix the failure.
3. Re-stage the affected files with explicit paths.
4. Replace the existing workflow commit with a new single squashed commit that
   includes the fixes.
5. Re-run this quality gate.

Do not push or create the PR until `tool-test-check` reports that the gate passed.

### Step 6: Push and create PR

The bundled script pushes the branch and creates the PR. First, write the PR
body to a temp file:

```bash
cat > /tmp/pr-body.md <<'PREOF'
## Summary
<2-4 bullet points summarizing the changes>

Closes #<N>

## Preview
- Standard entry: `<route reviewers should inspect>`
- Local build preview: run `bash .agents/skills/tool-preview/scripts/start-preview.sh --mode preview`

## Test plan
- [ ] <verification steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
```

Then invoke the script:

```bash
bash "$SKILL_DIR/scripts/create-pr.sh" \
  --issue-id <N> \
  --title "type(scope): #<N> <description>" \
  --body "$(cat /tmp/pr-body.md)" \
  --base master
```

The script will:
- Validate the current branch matches `issue-<id>-*`
- **Validate exactly 1 commit ahead of base** (enforces the single-commit rule; rejects 0 or >1)
- **Rebase onto latest `origin/master`** via the bundled `rebase-before-push.sh` script.
  This fetches origin and rebases the current branch to avoid non-fast-forward
  pushes. If a conflict is detected, the script aborts and reports the conflict
  — resolve it manually, then re-run.
- Push with `-u` upstream tracking
- Create the PR via `gh pr create`
- Print the PR URL

The PR title should match the commit subject line.

### Step 7: Build preview — invoke `tool-preview`

After push, start a production-build preview and leave it running as the local
human-review entry point for this PR. This intentionally uses built VitePress
output instead of watcher-based `pnpm dev`, and the exposed local port is meant
for a human reviewer to open in a browser before the PR is merged or abandoned.

**Invoke the tool-preview skill** with preview mode:

```bash
bash .agents/skills/tool-preview/scripts/start-preview.sh --mode preview --site testbed
```

What it does:
1. Auto-allocates a free port starting from 5000.
2. Runs `pnpm build:testbed` to produce a production build.
3. Starts the preview server against the built output.
4. Waits up to 60 seconds for the preview server URL.
5. Prints a compact table with the local preview URL, port, mode, and log file.
6. Keeps the preview server running for human browser review.

Keep this local preview alive until the PR is merged, abandoned, or no longer needs visual inspection. The post-PR cleanup workflow (`tool-post-pr`) is responsible for stopping the repo-scoped preview process.

If the build preview fails:

1. Diagnose the build or preview error from the captured log output.
2. Fix the issue locally.
3. Amend the commit: `git add <fixed-files> && git commit --amend --no-edit`.
4. Force-push: `git push --force-with-lease`.
5. Re-run Step 7.

The build preview must be running and accessible for human review before proceeding to CI verification.

When writing the PR body and final report, distinguish clearly between:
- **Local build preview**: a running local server from `start-preview.sh --mode preview` for human browser inspection.
- **Standard preview entry**: the built testbed route reviewers should inspect, for example `/blogs/test/mermaid.html` for Mermaid changes or `/` for broad theme changes.

### Step 8: CI verification — invoke `tool-ci-check`

After the PR is created, invoke the **tool-ci-check** skill to wait for and
verify all CI checks pass. This step blocks the final report until every
required CI job has succeeded.

Invoke `tool-ci-check` with the PR number from Step 6. It will:

1. Detect the PR from the current branch
2. Poll CI status until all jobs complete
3. If any job fails, report the failure, fetch logs, and stop — do NOT proceed
   to Step 9
4. If all jobs pass, continue to Step 9

If CI is still `in_progress`, poll at **120-second (2-minute) intervals**
and expect 3–4 rounds total (~6–8 minutes) for all CI jobs to complete. If CI
hasn't finished after 4 rounds (8 minutes), report the slow jobs and continue
polling at the same interval. Do not proceed past this step until CI is fully
green.

If CI fails:

1. Report which jobs failed with links to the logs
2. Diagnose the root cause
3. Fix the issue locally and amend the commit
4. Force-push and re-trigger CI
5. Loop back to checking CI status

### Step 9: Report

Output a summary table. The Issue and PR columns must contain the **raw full
URL** — no markdown links, no `#N` prefix. Users need to see and copy the URL
directly:

| Step | Result |
|------|--------|
| Issue | https://github.com/Albert26193/vitepress-theme-link/issues/N |
| Branch | `issue-<id>-<slug>` |
| Quality gate | Passed — `<tool-test-check summary>` |
| Build preview | Started — `<local preview URL> (<N>s)`; standard entry `<route>` |
| Commit | `<hash>` — subject |
| PR | https://github.com/Albert26193/vitepress-theme-link/pull/M |
| CI | Passed — `<ci-status-summary>` |

Do not wrap the URL in a markdown link or prefix it with `#N` — just paste
the bare https URL as the cell content.

## GH_TOKEN handling

When `gh auth status` fails, check if `$GH_TOKEN` or `$GITHUB_TOKEN` is set.
If available, export it for the session. If not, inform the user and stop.

## Common pitfalls

- **zsh bracket globbing**: Always quote `-f` values with `'key=value'` syntax
  to prevent `[]` from being interpreted as glob patterns.
- **Branch off wrong base**: Create the branch from the current working state
  so uncommitted changes carry over. Don't stash unless needed.
- **Wrong base for PR**: The PR base should be `master` (or `main`), not the
  working branch's parent.
- **Preserving .agents/**: This project uses `.agents/` as the single source of
  truth for AI IDE configs. Don't stage IDE dot-directories (`.claude/`,
  `.cursor/`, `.codex/`) — they should be symlink-managed via
  `scripts/link_agents.sh`.
