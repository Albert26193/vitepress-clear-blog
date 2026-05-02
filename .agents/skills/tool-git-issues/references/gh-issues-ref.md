# gh CLI — Issues Reference

Quick reference for issue-related `gh` commands. Covers everything the MCP server can't do (create, update, comment).

## Issue CRUD

### Create an issue

```bash
# Full featured (supports type, labels, assignees, milestone)
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="Issue title" \
  -f body="Issue body in markdown" \
  -f type="Bug" \
  --jq '{number, html_url}'

# Quick create (no type support)
gh issue create \
  --title "Issue title" \
  --body "Issue body" \
  --repo {owner}/{repo}
```

`gh issue create` does **not** support `--type`. Use `gh api` when you need issue types.

### Read an issue

```bash
# JSON
gh issue view {number} --json number,title,body,state,labels,assignees,milestone

# GraphQL for nested data (sub-issues, project items)
gh api graphql -f query='
  query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      issue(number:$number) { title body state }
    }
  }' -f owner={owner} -f repo={repo} -f number={number}
```

### Update an issue

```bash
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f title="Updated title" \
  -f state=closed \
  --jq '{number, html_url}'
```

Only include fields you want to change. Mutable fields: `title`, `body`, `state` (open/closed), `labels`, `assignees`, `milestone`.

### Add a comment

```bash
gh api repos/{owner}/{repo}/issues/{number}/comments \
  -X POST \
  -f body="Comment text in markdown"
```

### Close an issue

```bash
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f state=closed
```

## Optional Parameters for `gh api POST`

```
-f type="Bug"                    # Issue type (Bug, Feature, Task, Epic, etc.)
-f labels[]="bug"                # Labels (repeat for multiple)
-f assignees[]="username"        # Assignees (repeat for multiple)
-f milestone=1                   # Milestone number
```

## Listing & Searching

### List issues

```bash
# By state and label
gh issue list --state open --label "bug" --repo {owner}/{repo}

# With JSON output
gh issue list --state open --limit 50 --json number,title,labels,assignees

# Filter by assignee, milestone, or author
gh issue list --assignee @me --state open
gh issue list --milestone "v2.0" --state open
gh issue list --author username
```

### Search issues (GitHub search syntax)

```bash
gh search issues "is:open label:bug repo:{owner}/{repo}" \
  --sort created --order desc --limit 20

# Text search with qualifiers
gh search issues "login crash in:title repo:{owner}/{repo} type:issue"

# Date range and author
gh search issues "is:issue created:>=2024-01-01 author:username"
```

Common qualifiers: `is:open|closed|issue|pr`, `label:NAME`, `author:USER`, `assignee:USER`, `milestone:TITLE`, `created:|updated:`, `no:label|assignee|milestone`.

## Issue Type Discovery

Issue types are org-level metadata. To discover what's available:

```bash
# List issue types for an org
gh api graphql -f query='
  query($login:String!) {
    organization(login:$login) {
      issueTypes(first:10) { nodes { name } }
    }
  }' -f login={org} \
  --jq '.data.organization.issueTypes.nodes[].name'

# List templates for a repo
gh api repos/{owner}/{repo}/issue_templates --jq '.[].name'
```

## Useful Flags

| Flag | Purpose |
|------|---------|
| `--jq '...'` | Extract fields from JSON response |
| `--field name=value` / `-f` | Set request body fields |
| `--raw-field name=value` | String-typed field (no type coercion) |
| `-X METHOD` | HTTP method (POST, PATCH, GET, DELETE) |
| `--silent` | Suppress progress output |
| `--paginate` | Auto-fetch all pages |
