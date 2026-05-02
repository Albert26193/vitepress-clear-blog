# gh CLI — Full Reference

Comprehensive `gh` CLI reference covering issues, PRs, repos, and API usage patterns.

See also: [gh-issues-ref.md](gh-issues-ref.md) for issue-specific commands.

---

## Authentication & Setup

```bash
gh auth login        # Interactive login (HTTPS or SSH)
gh auth status       # Show current auth state
gh auth token        # Print current token (useful for scripting)
```

## Issues

Full issue command reference is in [gh-issues-ref.md](gh-issues-ref.md). Quick summary:

```bash
gh issue list                        # List issues
gh issue view {number}               # View issue details
gh issue create                       # Quick create (no type support)
gh api repos/{o}/{r}/issues          # REST API for full create/update
```

## Pull Requests

### Create

```bash
gh pr create \
  --title "PR title" \
  --body "PR description" \
  --base main \
  --head feature-branch

# With reviewers, labels, milestone
gh pr create \
  --title "Add dark mode" \
  --body "Implements theme toggle" \
  --reviewer alice,bob \
  --label "enhancement" \
  --milestone "v2.0"
```

### View & List

```bash
gh pr view {number} --json number,title,state,reviews,checks
gh pr list --state open --label "needs-review"
gh pr list --author @me
gh pr list --search "status:failure"    # PRs with failing CI
```

### Checkout & Status

```bash
gh pr checkout {number}                 # Check out a PR branch locally
gh pr status                            # Show status of current branch PR
gh pr checks {number}                   # Show CI check results
```

### Review & Merge

```bash
gh pr review {number} --approve
gh pr review {number} --request-changes --body "Needs tests"
gh pr review {number} --comment --body "LGTM, one nit"

gh pr merge {number} --squash
gh pr merge {number} --rebase
gh pr merge {number} --merge             # Create merge commit
```

### Draft & Ready

```bash
gh pr create --draft                     # Create as draft
gh pr ready {number}                     # Mark draft as ready for review
```

## Repositories

```bash
gh repo view {owner}/{repo}              # Open in browser
gh repo view {owner}/{repo} --json name,description,stargazers_count
gh repo clone {owner}/{repo}
gh repo fork {owner}/{repo}              # Fork and clone
gh repo create my-project --public       # Create new repo on GitHub
```

## `gh api` — REST & GraphQL

The workhorse for anything not covered by top-level commands.

### REST API

```bash
# GET request
gh api repos/{owner}/{repo} --jq '.description'

# POST with body
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="Title" \
  -f body="Body" \
  --jq '{number, html_url}'

# PATCH
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f state=closed

# Multiple labels (repeat the key)
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="Title" \
  -f labels[]="bug" \
  -f labels[]="high-priority"

# Pagination (auto-fetch all pages, max 500)
gh api repos/{owner}/{repo}/issues --paginate --jq '.[].title'
```

### GraphQL API

```bash
gh api graphql -f query='
  query($owner:String!, $repo:String!) {
    repository(owner:$owner, name:$repo) {
      issues(first:10, states:OPEN) {
        nodes { number title }
      }
    }
  }' -f owner={owner} -f repo={repo}
```

### `--field` vs `--raw-field`

| Flag | Behavior |
|------|----------|
| `-f key=value` | Infers type: `true`→bool, `42`→int |
| `-F key=value` | Always sends as string (alias for `--raw-field`) |

Use `-F` / `--raw-field` when a value looks like a number or boolean but must be a string.

## `--jq` Output Filtering

```bash
# Extract a single field
gh issue view 42 --json title,number --jq '.title'

# Build custom output
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="Bug" \
  --jq '"Created #\(.number): \(.html_url)"'

# Iterate arrays
gh issue list --json number,title --jq '.[] | "#\(.number) \(.title)"'
```

## Common Flags

| Flag | Applies to | Purpose |
|------|-----------|---------|
| `--repo {owner}/{repo}` | Most commands | Override repo detection |
| `--json field1,field2` | `view`, `list` | Output fields as JSON |
| `--jq 'expr'` | Any JSON output | Filter/format with jq |
| `--template '{{.field}}'` | Some commands | Go-template formatting |
| `-R`, `--repo` | Most commands | Explicit repo override |
| `-L`, `--limit N` | `list`, `search` | Max results (default 30) |
| `--state open\|closed\|all` | `list` | Filter by state |
| `--label "name"` | `list`, `search` | Filter by label |
| `--assignee @me\|user` | `list` | Filter by assignee |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GH_TOKEN` | Auth token (overrides stored login) |
| `GH_HOST` | GitHub Enterprise hostname |
| `GH_REPO` | Default repo in `owner/repo` format |
| `GH_DEBUG` | Set to `1` for verbose API logging |
| `GH_PAGER` | Pager for long output (default `less`) |
| `NO_COLOR` | Set to `1` to disable colored output |
