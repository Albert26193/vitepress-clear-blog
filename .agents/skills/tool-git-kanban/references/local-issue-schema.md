# Local Issue Schema

Use this reference when designing or migrating `.ai_dev/issues` files for Kanban synchronization.

## Required frontmatter

```yaml
package: root | theme | plugin-callouts | plugin-config | plugin-codeblock-fold | plugin-details-block | plugin-hashtag | plugin-analyzer | docs | intro
type: feat | fix | test | docs | refactor | chore | perf | discussion
priority: P0 | P1 | P2 | P3
status: todo | in_progress | done | blocked | discussion
local_id: optional stable id, usually the filename stem
tags: []
depends_on: []
```

## Local-only issues

A `.ai_dev/issues/*.md` file is valid even when it has no corresponding GitHub Issue yet. In that state, omit the entire `github` block and the entire `kanban` block. Push should create the remote issue, add it to the project, then write the discovered metadata back.

Lifecycle states:

| State | Required remote metadata | Meaning |
|-------|--------------------------|---------|
| local draft | none | Markdown-only backlog item |
| issue only | `github.issue_number` | GitHub Issue exists, not yet linked to Project |
| board item | `github.issue_number`, `kanban.item_id` | Fully synchronized item |

## Optional sync frontmatter

```yaml
github:
  owner: Albert26193
  repo: vitepress-theme-link
  issue_number: 12
  # Optional cache; derive from owner/repo/issue_number when absent.
  issue_url: https://github.com/OWNER/REPO/issues/12
kanban:
  project_owner: Albert26193
  project_number: 1
  item_id: PVTI_xxx
  status_field_id: PVTSSF_xxx
  status_option_id: xxx
  status: Todo
  last_pulled_at: 2026-05-05T12:34:56Z
  last_pushed_at: 2026-05-05T12:40:00Z
remote_updated_at: 2026-05-05T12:30:00Z
```

## Body sections

Keep the current body structure unless the user asks to migrate it:

```markdown
# Title

Short description.

## 验收标准

- [ ] Acceptance criterion

## 备注

- Notes
```

## Slug rule

When creating a local file for a remote issue without an existing match:

1. Prefer an existing stable slug if the remote issue body already references a local file.
2. Otherwise slugify the title in kebab-case.
3. If there is a collision, suffix the GitHub issue number: `<slug>-<number>.md`.
