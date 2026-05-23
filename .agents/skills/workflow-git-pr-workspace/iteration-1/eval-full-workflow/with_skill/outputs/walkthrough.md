# PATH A Walkthrough: "修改 Footer.vue 加 dark mode 按钮"

## Step 0a: Find candidate issue
- `git branch --show-current` → `dev` (no issue-<id> pattern)
- User prompt: no `#<N>` or issue reference
- **Decision: No candidate → PATH A**

## Step 1: Analyze changes
- Files: `packages/theme/src/components/Footer.vue`
- Scope: `theme`
- Area label: `area:theme`
- Type: `feat` (new feature)

## Step 2: Create issue (PATH A → invoke tool-git-issues)
- Template: feature-bug.md
- Issue type: Feature
- Title: "Add dark mode toggle button to footer"
- Labels: area:theme, priority:P2
- Would call: `gh api repos/Albert26193/vitepress-theme-link/issues -X POST ...`

## Step 3: Create branch
- Issue title → slug: "add-dark-mode-toggle-footer"
- Branch: `issue-<N>-add-dark-mode-toggle-footer`

## Step 4: Commit
- `git add packages/theme/src/components/Footer.vue`
- Message: `feat(theme): #<N> add dark mode toggle button to footer`

## Step 5: Push + PR
- `git push -u origin issue-<N>-add-dark-mode-toggle-footer`
- `gh pr create --base master` with Closes #<N>

## Verdict: ✅ All steps follow the skill correctly
