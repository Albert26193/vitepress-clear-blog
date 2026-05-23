---
name: tool-git-kanban
description: >
  Script-driven synchronization between local Markdown issues under .ai_dev/issues
  and a GitHub Projects Kanban board using gh project / GraphQL. Use this skill
  whenever the user asks to sync kanban, GitHub Projects, project board columns,
  .ai_dev/issues, local issue files, pull remote issues into local markdown, push
  local issues to the project board, or map local issue status to remote Kanban
  status. Prefer the bundled scripts over ad-hoc shell commands: pull means
  remote overwrites local after human confirmation, push means local overwrites
  remote after reviewing the generated plan.
---

# Git Kanban Sync for `.ai_dev/issues`

Synchronize the local AI issue pool with a GitHub Projects v2 Kanban board. The
source of truth is explicit per operation:

- **pull**: remote GitHub Project overwrites local `.ai_dev/issues` files, but
  only after showing the diff scope and getting human confirmation.
- **push**: local `.ai_dev/issues` overwrites remote GitHub Issue / Project
  fields. Confirm before creating or closing remote issues because those actions
  are visible to others.

Use `gh` for GitHub operations. Verify the active token has the `project` scope
before any project-board operation.

Use the bundled scripts for routine work. They provide stable JSON interfaces,
separate dry-run planning from mutation, and force explicit confirmation tokens
for destructive or visible writes.

```bash
GIT_ROOT="$(git rev-parse --show-toplevel)"
SKILL_DIR="$GIT_ROOT/.agents/skills/tool-git-kanban"
```

## Script pipeline

| Step | Script | Purpose | Writes? |
|------|--------|---------|---------|
| 0 | `scripts/s0-discover.sh` | Discover repo/project metadata and fields | No |
| 1 | `scripts/s1-scan-local.sh` | Parse `.ai_dev/issues/*.md` into JSON | No |
| 2 | `scripts/s2-fetch-remote.sh` | Fetch GitHub Project items | No |
| 3 | `scripts/s3-plan-pull.sh` | Build remote-over-local pull plan | No |
| 4 | `scripts/s4-apply-pull.sh` | Apply reviewed pull plan | Yes, gated |
| 5 | `scripts/s5-plan-push.sh` | Build local-over-remote push plan | No |
| 6 | `scripts/s6-apply-push.sh` | Apply reviewed push plan | Yes, gated |
| CLI | `scripts/git-kanban.sh` | Dispatch wrapper for all steps | Depends |

Current apply scripts intentionally wire the confirmation gate first; expand the
implementation behind that gate rather than bypassing it.

## Language policy

All remote GitHub issues MUST be written in English. This applies to:
- **New issues**: title and body must be in English when creating via push
- **Existing issues**: update remote titles and bodies to English during sync
- **Local files**: `.ai_dev/issues/*.md` files use English titles (first H1) and English body content. Section headers: `## Acceptance Criteria` (for `## 验收标准`), `## Notes` (for `## 备注`), `## Discussion Points` (for `## 讨论要点`)

When creating a new issue during push, validate that the local file has an English title and body before creating the remote issue. Reject or auto-translate if Chinese content is detected.

## First decisions

1. Identify the owner, repository, project number, and project owner type
   (`user` or `org`). Prefer explicit user input; otherwise inspect `gh repo
   view --json owner,name` and `gh project list --owner <owner>`.
2. Identify the Project Status field and its options with `gh project
   field-list <project-number> --owner <owner> --format json`.
3. Read `.ai_dev/issues/README.md` and representative issue files to preserve
   the current format before proposing changes.
4. If the user asks for design advice, recommend the schema below and ask before
   mass-editing existing issues.

## Local issue format

Keep the existing Markdown-first format. Add only synchronization metadata to
frontmatter so old issue files remain readable and editable.

```markdown
---
package: plugin-callout
type: fix
priority: P2
status: todo
local_id: callout-ts-types
tags: [类型, DX]
depends_on: []
# github and kanban blocks are optional. A local-only markdown issue may have no
# remote GitHub Issue and no Project item until push creates them.
github:
  owner: Albert26193
  repo: vitepress-theme-link
  issue_number: 12
  # issue_url is optional; derive it from owner/repo/issue_number when absent.
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
---

# Issue title

Description.

## 验收标准

- [ ] Acceptance criterion

## 备注

- Notes
```

### Local-only issues

Treat a Markdown file without `github.issue_number` as a valid local-only issue,
not as incomplete data. This is the normal backlog authoring flow: humans or AI
can draft work locally first, then `push` creates the GitHub Issue, adds it to
the Project, and writes `github.*` / `kanban.*` metadata back into the file.

A file can be in one of these lifecycle states:

| Local state | Frontmatter shape | Meaning | Push behavior |
|-------------|-------------------|---------|---------------|
| local draft | no `github`, no `kanban` | Exists only as `.md` | Create GitHub Issue, add to Project |
| issue only | has `github.issue_number`, no `kanban.item_id` | GitHub Issue exists but not on board | Add Issue to Project |
| board item | has `github.issue_number` and `kanban.item_id` | Fully linked | Update issue/body/status fields |
| remote cache partial | has some remote metadata | Previously synced but incomplete | Re-discover missing IDs before mutating |

Do not require `issue_url`; when `github.owner`, `github.repo`, and
`github.issue_number` exist, derive the URL as needed.

### Field meanings

| Field | Purpose |
|-------|---------|
| `status` | Local normalized status: `todo`, `in_progress`, `done`, `blocked`, `discussion`. Required even for local-only issues. |
| `local_id` | Optional stable local identifier, usually the filename stem. Useful before any GitHub Issue exists. |
| `github.issue_number` | Remote GitHub Issue number. Missing means the local issue has not been created remotely. |
| `github.issue_url` | Optional cache for convenience. Do not require it; derive it from `owner`, `repo`, and `issue_number` when possible. |
| `kanban.item_id` | ProjectV2 item id for field updates. Missing means the issue is not yet on the project. |
| `kanban.status` | Human-readable Project Status option name, e.g. `Todo`, `In Progress`, `Done`. |
| `kanban.status_option_id` | Project Status option id used by GraphQL mutations. |
| `remote_updated_at` | Remote issue `updatedAt`; use it to detect likely stale local files before push. |

### Recommended status mapping

Adapt the labels to the actual project options after reading the Status field.

| Local `status` | Typical Kanban Status | GitHub Issue state |
|----------------|-----------------------|--------------------|
| `todo` | `Todo` / `Backlog` | open |
| `in_progress` | `In Progress` | open |
| `blocked` | `Blocked` | open |
| `discussion` | `Discussion` / `Backlog` | open |
| `done` | `Done` | closed |

If the project lacks a `Blocked` or `Discussion` option, keep the local status
and map the kanban status to the closest available column; report the lossy
mapping to the user.

## Pull workflow: remote overwrites local

Use pull when the user says things like “从 kanban 拉下来”, “pull project board”,
“远程覆盖本地”, “同步远程 issue 到 .ai_dev/issues”.

1. Verify `gh auth status` includes `project`.
2. Resolve owner, repo, project number, Status field, and status options.
3. Fetch project items with:

   ```bash
   bash "$SKILL_DIR/scripts/git-kanban.sh" fetch-remote --owner <owner> --project-number <number>
   ```
4. For each item backed by a GitHub Issue:
   - Fetch issue title, body, state, labels, assignees, and updated timestamp.
   - Convert GitHub Issue + Project fields into the local Markdown schema.
   - Match existing local files by `github.issue_number`, then by slugified
     title only if no issue number is present.
5. Build a diff plan before writing:
   - files to create
   - files to update
   - local files that have no matching remote issue
   - status changes
   - metadata-only changes
6. Show the diff scope to the user and ask for confirmation. Do not write files
   until confirmed because pull intentionally overwrites local edits.
7. After confirmation, write the affected local Markdown files and update
   `.ai_dev/issues/README.md` if the index is part of the chosen local source.

### Pull confirmation prompt

Use a concise confirmation like:

```text
Pull will overwrite local issue files from GitHub Project <owner>/<number>.
Planned changes: 8 create, 12 update, 3 metadata-only, 2 local-only unchanged.
Notable status changes: a.md todo→in_progress, b.md in_progress→done.
Proceed with remote-over-local pull?
```

If any local file has uncommitted changes, mention that explicitly and recommend
committing or stashing first.

## Push workflow: local overwrites remote

Use push when the user says things like “把 .ai_dev/issues 推到 kanban”, “push
local issues”, “本地覆盖远程”, “更新 project board 状态”.

1. Verify `gh auth status` includes `project`.
2. Read local issue files and validate required fields: title, `type`,
   `priority`, and `status`.
3. **Language check**: validate that all issue titles and bodies are in English.
   If Chinese content is detected in an issue that will be created or updated,
   translate it to English before pushing. Remote GitHub issues must be English-only.
4. Resolve project field IDs and status option IDs.
5. Build a push plan:
   - create GitHub Issues for local-only files without a `github` block or without `github.issue_number`
   - update issue title/body/labels for existing issue numbers
   - add missing issues to the Project
   - update Project Status field from local `status`
   - close issues whose local status is `done` if the user agrees
6. Before making visible remote changes, summarize the plan and ask for
   confirmation unless the user already explicitly authorized this exact push.
7. Execute with `gh api` and `gh project item-add` / GraphQL mutations.
8. Write back remote IDs and timestamps to local frontmatter after successful
   remote updates.

### Push safety

- Do not delete remote issues during push. If a local file disappeared, report it
  as “remote-only” and ask what to do.
- Do not close issues solely because a checklist is complete; close only when
  local `status: done` and the user confirms that push may close issues.
- If `remote_updated_at` is newer than `last_pulled_at`, warn that remote changed
  since the last pull and ask whether to overwrite anyway.

## GitHub commands

### List projects and fields

```bash
gh project list --owner <owner> --format json
gh project field-list <project-number> --owner <owner> --format json
```

### List items

```bash
gh project item-list <project-number> --owner <owner> --format json --limit 1000
```

### Add an issue to a project

```bash
gh project item-add <project-number> --owner <owner> --url <issue-url> --format json
```

### Update a ProjectV2 single-select Status field

Use GraphQL when `gh project item-edit` cannot express the required update or
when you already have node IDs:

```bash
gh api graphql -f query='mutation($project:ID!, $item:ID!, $field:ID!, $option:String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project
    itemId: $item
    fieldId: $field
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}' \
  -f project=<project-id> \
  -f item=<item-id> \
  -f field=<status-field-id> \
  -f option=<status-option-id>
```

## Output style

Report sync plans as tables:

| Action | Count | Examples |
|--------|-------|----------|
| Create local | 3 | `new-router.md`, `docs-api.md` |
| Update local | 5 | `callout-ts-types.md` |
| Update remote status | 4 | `theme-search-enhancement.md`: Todo → In Progress |

End with either:

- “No changes were written; waiting for confirmation.”
- “Sync complete: X local files updated, Y remote items updated.”

## When to use other skills

- Use `tool-git-issues` for one-off GitHub Issue creation or editing that does
  not involve `.ai_dev/issues` or Project board synchronization.
- Use this skill for any operation where local Markdown issue files and GitHub
  Project Kanban state must stay in sync.
