---
name: workflow-git-pr
description: Full git workflow from unstaged changes to a merged PR. Use this skill whenever the user wants to turn current changes into a GitHub issue, proper branch, commit, and pull request — especially when they say things like "提交并提 PR", "create an issue and PR for these changes", "按照改动建 issue 提 pr", "push these changes with a proper issue", or any request that involves creating an issue and PR from working-tree changes. This skill orchestrates the tool-git-commit and tool-git-issues skills into a single correct workflow.
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

Orchestrates the complete path from unstaged changes to a pull request. This
skill delegates the two specialized steps — issue creation and commit message
generation — to the `tool-git-issues` and `tool-git-commit` skills rather than
duplicating their logic.

## Skill delegation

| Step | Delegates to | What it does |
|------|-------------|--------------|
| Analyze + create issue | **tool-git-issues** | Reads templates, picks type/labels, crafts title+body, calls `gh api` |
| Analyze + write commit | **tool-git-commit** | Gathers context, determines type/scope, writes Conventional Commits message, validates with checker |
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
| **Files changed** | Do the paths in `git diff --stat` relate to the issue's `area:` label? | Issue tagged `area:theme` but diff is only in `packages/docs/` |
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
  Issue area:      <area label from issue>

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

This outputs JSON with `scope`, `area_label`, `changed_files`, `packages`, and
`suggested_type`. The LLM should review `suggested_type` and override it if the
context warrants (e.g., a `fix` tag on what is clearly a `feat`).

The script handles the scope/area-label mapping for all known packages in this
monorepo. Root-level file changes produce `scope: null` and `area_label: "area:root"`.

### Step 2: Create the issue — invoke `tool-git-issues` → PATH A only

**Only run this step for PATH A** (no candidate issue, or user chose "create new"
after a mismatch).

**Language**: All issue titles and bodies MUST be written in English. The
tool-git-issues skill enforces this requirement — see its "Language" section.

Invoke the **tool-git-issues** skill to handle issue creation. Pass it the
analysis from step 1 (scope, area label, change summary from diffs).

The tool-git-issues skill will:
- Select the correct template (`feature-bug.md`, `task.md`, etc.) from its assets/
- Determine the GitHub issue type (Feature, Bug, Task)
- Map the scope to the correct `area:` label
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

### Step 5: Push and create PR

The bundled script pushes the branch and creates the PR. First, write the PR
body to a temp file:

```bash
cat > /tmp/pr-body.md <<'PREOF'
## Summary
<2-4 bullet points summarizing the changes>

Closes #<N>

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
- Push with `-u` upstream tracking
- Create the PR via `gh pr create`
- Print the PR URL

The PR title should match the commit subject line.

### Step 6: Report

Output a summary table. The Issue and PR columns must contain the **raw full
URL** — no markdown links, no `#N` prefix. Users need to see and copy the URL
directly:

| Step | Result |
|------|--------|
| Issue | https://github.com/Albert26193/vitepress-clear-blog/issues/N |
| Branch | `issue-<id>-<slug>` |
| Commit | `<hash>` — subject |
| PR | https://github.com/Albert26193/vitepress-clear-blog/pull/M |

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
