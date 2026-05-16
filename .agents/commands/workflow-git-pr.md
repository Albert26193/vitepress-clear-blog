---
name: workflow-git-pr
description: 'Full git workflow from unstaged changes to a merged PR. Use this skill whenever the user wants to turn current changes into a GitHub issue, proper branch, commit, quality gate, and pull request — especially when they say things like "提交并提 PR", "create an issue and PR for these changes", "按照改动建 issue 提 pr", "push these changes with a proper issue", or any request that involves creating an issue and PR from working-tree changes. This skill orchestrates the tool-git-issues, tool-git-commit, tool-test-check, and CI skills into a single workflow, and it must bring in std-antfu-vue when PR changes touch Vue SFCs, theme Vue components, NewLayout.vue, Composition API, props/emits, composables, or Vue UI refactors.'
---

Invoke the skill at `../skills/workflow-git-pr/SKILL.md` and follow its instructions exactly.
