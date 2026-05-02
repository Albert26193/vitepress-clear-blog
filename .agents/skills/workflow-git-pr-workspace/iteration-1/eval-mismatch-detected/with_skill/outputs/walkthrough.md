# Mismatch Walkthrough: "issue-2-fix-login-bug, 但改动是 agent tooling"

## Step 0a: Find candidate issue
- `git branch --show-current` → `issue-2-fix-login-bug`
- Pattern match: `issue-2-*` → extract ID **2**
- **Decision: Candidate found → proceed to Step 0b**

## Step 0b: Validate match
- `gh issue view 2` → "(hypothetical) Fix login page crash on Safari"
- Labels: area:theme, priority:P1
- `git diff --stat` → .agents/ (633 lines), scripts/link_agents.sh (554 lines)
- **Comparison:**

| Dimension | Issue #2 | Actual diff | Match? |
|-----------|----------|-------------|:---:|
| Files | packages/theme/ | .agents/, scripts/ | ❌ |
| Nature | Bug fix | New infrastructure feat | ❌ |
| Area label | area:theme | (would be area:root) | ❌ |

- **Decision: MISMATCH → present conflict to user**

## Step 0c: Expected output

```
⚠️  Issue #2 ("Fix login page crash on Safari") doesn't seem to match:

  Issue describes: Bug fix for login page in Safari browser
  Current diff:    81 new files in .agents/ and scripts/ — AI agent tooling infrastructure

  Changed files:   .agents/AGENTS.md (+633), scripts/link_agents.sh (+554), ...
  Issue area:      area:theme vs actual area:root

What would you like to do?
  A) Proceed anyway — link these changes to issue #2
  B) Create a new issue instead — start fresh
  C) Let me specify a different issue number
```

## Verdict: ✅ Correctly detects mismatch and prevents blind linking
