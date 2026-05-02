---
name: tool-git-issues
description: 'Create, update, and manage GitHub issues using MCP tools. Use this skill when users want to create bug reports, feature requests, or task issues, update existing issues, add labels/assignees/milestones, set issue fields (dates, priority, custom fields), set issue types, manage issue workflows, link issues, add dependencies, or track blocked-by/blocking relationships. Triggers on requests like "create an issue", "file a bug", "request a feature", "update issue X", "set the priority", "set the start date", "link issues", "add dependency", "blocked by", "blocking", or any GitHub issue management task.'
---

# GitHub Issues

Manage GitHub issues using the `modelcontextprotocol/server-github` MCP server.

## Available Tools

### MCP Tools (read operations)

| Tool | Purpose |
|------|---------|
| `mcp__github__issue_read` | Read issue details, sub-issues, comments, labels (methods: get, get_comments, get_sub_issues, get_labels) |
| `mcp__github__list_issues` | List and filter repository issues by state, labels, date |
| `mcp__github__search_issues` | Search issues across repos using GitHub search syntax |
| `mcp__github__projects_list` | List projects, project fields, project items, status updates |
| `mcp__github__projects_get` | Get details of a project, field, item, or status update |
| `mcp__github__projects_write` | Add/update/delete project items, create status updates |

### CLI / REST API (write operations)

The MCP server does not currently support creating, updating, or commenting on issues. Use `gh` CLI for these operations.

| Operation | Quick Command |
|-----------|---------------|
| Create issue | `gh api repos/{owner}/{repo}/issues -X POST ...` |
| Update issue | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH ...` |
| Add comment | `gh api repos/{owner}/{repo}/issues/{number}/comments -X POST ...` |
| Close issue | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f state=closed` |

For the full `gh` command reference (parameters, listing, searching, GraphQL), read [references/gh-issues-ref.md](references/gh-issues-ref.md). For PRs, repos, and general `gh` usage, read [references/gh-full-ref.md](references/gh-full-ref.md).

## Workflow

1. **Determine action**: Create, update, or query?
2. **Gather context**: Get repo info, existing labels, milestones if needed
3. **Structure content**: Read the appropriate template from [assets/](assets/), then fill in every section with the information gathered in step 2
4. **Execute**: Use MCP tools for reads, `gh api` for writes
5. **Confirm**: Report the issue URL to user

## Creating Issues

Use `gh api` to create issues. This supports all parameters including issue types.

```bash
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f 'title=Issue title' \
  -f 'body=Issue body in markdown' \
  -f 'type=Bug' \
  --jq '{number, html_url}'
```

### Optional Parameters

Add any of these flags to the `gh api` call:

```
-f type="Bug"                    # Issue type (Bug, Feature, Task, Epic, etc.)
-f labels[]="bug"                # Labels (repeat for multiple)
-f assignees[]="username"        # Assignees (repeat for multiple)
-f milestone=1                   # Milestone number
```

**Issue types** are organization-level metadata. To discover available types, use:
```bash
gh api graphql -f query='{ organization(login: "ORG") { issueTypes(first: 10) { nodes { name } } } }' --jq '.data.organization.issueTypes.nodes[].name'
```

**Prefer issue types over labels for categorization.** When issue types are available (e.g., Bug, Feature, Task), use the `type` parameter instead of applying equivalent labels like `bug` or `enhancement`. Issue types are the canonical way to categorize issues on GitHub. Only fall back to labels when the org has no issue types configured.

### Title Guidelines

- Be specific and actionable
- Keep under 72 characters
- When issue types are set, don't add redundant prefixes like `[Bug]`
- Examples:
  - `Login fails with SSO enabled` (with type=Bug)
  - `Add dark mode support` (with type=Feature)
  - `Add unit tests for auth module` (with type=Task)

## Templates

Before writing any issue body, read the corresponding template from [assets/](assets/). Each template defines the required body sections — use it as a guide and fill in every section based on what the user provides.

### Template Selection

| User says | GitHub type | Template |
|-----------|-------------|----------|
| Feature, enhancement, new capability, add | `Feature` | [assets/feature-bug.md](assets/feature-bug.md) |
| Bug, error, crash, broken, regression, not working | `Bug` | [assets/feature-bug.md](assets/feature-bug.md) |
| Test, coverage, test coverage | `Task` | [assets/test.md](assets/test.md) |
| Discussion, design, architecture decision, RFC | `Task` | [assets/discussion.md](assets/discussion.md) |
| Chore, refactor, docs, perf, style | `Task` | [assets/task.md](assets/task.md) |

### Project Labels

When creating issues for this monorepo, apply these labels to map project metadata:

| Project field | GitHub label | Example |
|--------------|-------------|---------|
| `package` | `area:root`, `area:theme`, `area:docs`, `area:plugin-callout`, `area:plugin-config`, `area:plugin-codeblock-fold`, `area:plugin-details-block`, `area:plugin-hashtag`, `area:plugin-analyzer` | `area:theme` |
| `priority` | `priority:P0`, `priority:P1`, `priority:P2`, `priority:P3` | `priority:P1` |
| `type` | Use GitHub issue type (`Bug`, `Feature`, `Task`) — don't duplicate with a label | `-f type="Bug"` |

**Why labels matter**: The `area:*` labels make it trivial to filter issues by module in the GitHub UI. Combined with `priority:*` labels, anyone can sort the backlog by package and urgency without reading every issue body. The label naming follows GitHub's canonical `area:` and `priority:` conventions, which also enables automated workflows and project board column rules.

## Updating Issues

Use `gh api` with PATCH:

```bash
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f state=closed \
  -f title="Updated title" \
  --jq '{number, html_url}'
```

Only include fields you want to change. Available fields: `title`, `body`, `state` (open/closed), `labels`, `assignees`, `milestone`.

## Examples

### Example 1: Feature

**User**: "Create an issue for adding local graph component to the theme"

**Process**: Read [assets/feature-bug.md](assets/feature-bug.md), gather scope, map package→label, then:

```bash
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f 'title=Implement local graph component' \
  -f 'type=Feature' \
  -f 'labels[]=area:theme' \
  -f 'labels[]=priority:P2' \
  -f 'body=## Description
The current graph system only has full-site (D3FullScreen) and page-level
(D3PageGraph) graphs. There is no way to show a local association network
for the current page, similar to Obsidian's Local Graph feature.

## Acceptance Criteria
- [ ] Create local graph component showing current page plus N-step neighbors
- [ ] Configurable neighbor depth (1-3 steps)
- [ ] Current page node highlighted
- [ ] Embeddable in post pages, not just sidebar overlay

## Notes
- Can build on existing D3ForceGraph.vue and transformPageD3Data()
- Listed as in-progress on the roadmap" \
  --jq '{number, html_url}'
```

### Example 2: Bug

**User**: "File a bug - the drag delta on the D3 graph is wrong in Firefox"

**Process**: Read [assets/feature-bug.md](assets/feature-bug.md), set labels accordingly, then:

```bash
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f 'title=Fix D3 graph drag delta calculation in Firefox' \
  -f 'type=Bug' \
  -f 'labels[]=area:theme' \
  -f 'labels[]=priority:P1' \
  -f 'body=## Description
The graph node drag offset is incorrect in Firefox because event deltaX/deltaY
values differ from Chromium when using SVG coordinate transforms.

## Acceptance Criteria
- [ ] Normalize drag delta across Chromium and Firefox
- [ ] Verify drag behavior in both browsers
- [ ] No regression in touch-based dragging

## Notes
- File: packages/theme/src/components/d3/D3ForceGraph.vue
- Firefox SVG event handling differs from Chromium for pointer events" \
  --jq '{number, html_url}'
```

## Common Labels

Use these standard labels when applicable:

| Label | Use For |
|-------|---------|
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `documentation` | Documentation updates |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `question` | Further information requested |
| `wontfix` | Will not be addressed |
| `duplicate` | Already exists |
| `high-priority` | Urgent issues |
| `duplicate` | Already exists |
| `high-priority` | Urgent issues |

## Tips

- Always confirm the repository context before creating issues
- Ask for missing critical information rather than guessing
- Link related issues when known: `Related to #123`
- For updates, fetch current issue first to preserve unchanged fields
- **zsh bracket globbing**: Always wrap `-f` values in single quotes when they contain `[]` (e.g. `-f 'labels[]=area:theme'`). zsh interprets `[]` as glob patterns, so unquoted `-f labels[]=area:theme` will fail with `no matches found`. Applies to `labels[]`, `assignees[]`, and any other array parameters.

## Extended Capabilities

The following features require REST or GraphQL APIs beyond the basic MCP tools. Each is documented in its own reference file so the agent only loads the knowledge it needs.

| Capability | When to use | Reference |
|------------|-------------|-----------|
| Advanced search | Complex queries with boolean logic, date ranges, cross-repo search, issue field filters (`field.name:value`) | [references/search.md](references/search.md) |
| Sub-issues & parent issues | Breaking work into hierarchical tasks | [references/sub-issues.md](references/sub-issues.md) |
| Issue dependencies | Tracking blocked-by / blocking relationships | [references/dependencies.md](references/dependencies.md) |
| Issue types (advanced) | GraphQL operations beyond MCP `list_issue_types` / `type` param | [references/issue-types.md](references/issue-types.md) |
| Projects V2 | Project boards, progress reports, field management | [references/projects.md](references/projects.md) |
| Issue fields | Custom metadata: dates, priority, text, numbers (private preview) | [references/issue-fields.md](references/issue-fields.md) |
| Images in issues | Embedding images in issue bodies and comments via CLI | [references/images.md](references/images.md) |
| gh CLI (issues) | Full `gh` reference for issue CRUD, listing, searching | [references/gh-issues-ref.md](references/gh-issues-ref.md) |
| gh CLI (full) | Comprehensive `gh` reference: PRs, repos, API, jq patterns | [references/gh-full-ref.md](references/gh-full-ref.md) |
