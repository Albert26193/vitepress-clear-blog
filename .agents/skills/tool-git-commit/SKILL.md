---
name: tool-git-commit
description: Generate Conventional Commits messages by analyzing git diff, merge base, and branch history. Use this skill whenever the user asks to write, generate, or draft a commit message — whether they say "帮我写 commit", "generate a commit message", "draft a commit", "what should I commit", or any request involving git commit message generation. Also use it when the user is about to commit changes and needs help phrasing the message.
---

# Git Commit Message Generator

Analyze the current git state and generate a commit message following the project's commit format. **This skill only generates the message — it never runs `git commit`.**

## Workflow

### Step 1: Gather Context

Run these commands to understand what changed:

```bash
# Find where the branch diverged from master (or main)
git merge-base master HEAD || git merge-base main HEAD

# Staged changes overview
git diff --cached --stat

# Unstaged changes overview
git diff --stat

# Branch commit log since divergence (use the merge-base hash from above)
git log <merge-base>..HEAD --oneline

# Detailed diffs (focus on staged first, then unstaged if staging is empty)
git diff --cached
git diff
```

### Step 2: Determine Issue ID

Look for the issue number in these places (in priority order):

1. **User request** — the user may have mentioned an issue in their prompt (e.g., "for issue #42")
2. **Branch name** — common patterns:
   - `feat/42-xxx` or `fix/42-xxx` → extract `42`
   - `fix/issue-99-empty-codeblock` → extract `99`
   - `feature/PROJ-123-description` → extract `123`
3. **Recent commit subjects** on the branch — `git log <merge-base>..HEAD --oneline`

If you find an issue ID from any source, use it as `#<N>` in the subject line.

If you cannot find one, use `#?` as a placeholder and tell the user to replace it with the actual issue number before committing. The checker script will reject `#?` — that's intentional, as it reminds the user to fill in a real issue ID before the final `git commit`.

### Step 3: Determine Type and Scope

**type** — pick the single best fit:
| Type | When |
|------|------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, deps, tooling, maintenance |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Reverting a previous commit |

**scope** — infer from the changed files:
- Changes in `packages/theme/` → `theme`
- Changes in `packages/docs/` → `docs`
- Changes in `packages/vitepress-plugin-xxx/` → `plugin-xxx`
- Changes affecting multiple packages → pick the primary one, or omit scope
- Root-level config changes → omit scope or use the affected tool name

### Step 4: Generate the Message

Read `assets/commit-template.md` for the exact format. The critical parts:

- **Subject line**: `type(scope): #<issue-id> <imperative description>` — use `#?` as placeholder if no issue ID is found. Keep it short, lowercase, no trailing period.
- **DESC section**: structured as `code:`, `test:`, and `summarize:` blocks with bullet points
- **Body lines**: max 200 characters each (commitlint warning threshold)
- **Footer**: include `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`

Guidelines for the body:
- `code:` — list the key code changes, one bullet per logical change
- `test:` — how the change was or should be tested; write `N/A` if not applicable
- `summarize:` — one bullet capturing the overall purpose, keep it concise

### Step 5: Validate

Run the bundled checker script (located alongside this SKILL.md) to catch format issues before showing the user:

```bash
SKILL_DIR=".agents/skills/tool-git-commit"
bash "$SKILL_DIR/scripts/commit_msg_checker.sh" < <generated-message-file>
```

If validation fails, fix the issues and re-check. The checker validates:
1. commitlint (`@commitlint/config-conventional`) — type enum, subject case, body line length
2. Issue reference (`#<N>`) present in the subject line

### Step 6: Present

Output the final message in a code block for the user to review. They can copy it directly or ask for adjustments.
