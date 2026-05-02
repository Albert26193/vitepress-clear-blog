# gh CLI — CI & Workflow Run Reference

Commands for inspecting GitHub Actions via `gh`.

## PR checks

```bash
# Show CI check results for a PR (status + conclusion per job)
gh pr view <number> --json statusCheckRollup

# With jq to extract key fields
gh pr view <number> --json statusCheckRollup --jq '
  .statusCheckRollup[] | {name, status, conclusion}
'
```

The `statusCheckRollup` array contains one object per check, with these
fields:

| Field | Description | Values |
|-------|-------------|--------|
| `__typename` | Type of check | `CheckRun`, `StatusContext` |
| `name` | Check name (job name in CI workflow) | `Lint`, `Type Check`, `Test`, `Build` |
| `status` | Execution state | `COMPLETED`, `IN_PROGRESS`, `QUEUED` |
| `conclusion` | Result when completed | `SUCCESS`, `FAILURE`, `SKIPPED`, `CANCELLED`, `NEUTRAL` |
| `workflowName` | Parent workflow | `CI`, `Deploy` |
| `detailsUrl` | Link to run detail page | URL |
| `startedAt` | ISO 8601 start | `2026-05-02T14:28:19Z` |
| `completedAt` | ISO 8601 completion | `2026-05-02T14:28:46Z` |

## Workflow runs

### List recent runs for a branch

```bash
gh run list --branch <branch> --limit 5 --json databaseId,status,conclusion,createdAt,displayTitle,event
```

Common fields: `databaseId`, `status`, `conclusion`, `createdAt`,
`displayTitle`, `event` (push/pull_request), `headBranch`, `headSha`,
`url`, `workflowName`.

### Get run details with jobs

```bash
gh run view <run_id> --json databaseId,createdAt,jobs,status,conclusion,displayTitle,event,headBranch
```

Each job object has: `name`, `databaseId`, `status`, `conclusion`,
`startedAt`, `completedAt`, `url`, `steps`.

### Get the latest run ID for a branch

```bash
gh run list --branch <branch> --limit 1 --json databaseId --jq '.[0].databaseId'
```

### View job logs in terminal

```bash
gh run view <run_id> --log --job <job_id>
```

Redirect to file:

```bash
gh run view <run_id> --log --job <job_id> > logs/JobName.log 2>&1
```

### Download artifacts (e.g., built dist)

```bash
gh run download <run_id> -n <artifact-name> -D <output-dir>
```

## Finding a PR from a branch

```bash
# List PRs whose head branch matches the current branch
gh pr list --head <branch> --json number --jq '.[0].number'
```

## Other useful commands

```bash
# Watch a run live (streams log)
gh run watch <run_id>

# Rerun a failed run
gh run rerun <run_id>

# Rerun only failed jobs
gh run rerun <run_id> --failed

# Cancel a running workflow
gh run cancel <run_id>
```
