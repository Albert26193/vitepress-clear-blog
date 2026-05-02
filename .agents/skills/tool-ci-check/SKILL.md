---
name: tool-ci-check
description: >
  Check GitHub Actions CI status and fetch workflow run logs for pull requests.
  Use this skill whenever the user asks about CI/CD status, wants to see if a
  PR's checks passed or failed, needs to pull workflow logs for debugging, or
  mentions "ci", "pipeline", "workflow run", "checks", "GitHub Actions", "actions",
  "CI/CD". Triggers on phrases like "看下 ci", "ci 状态", "check CI", "pipeline
  过了没", "拉 CI 日志", "拉取日志到本地", "workflow status", or any request to
  inspect GitHub Actions results. Also triggers after pushing to a PR branch when
  the user wants to verify CI results.
---

# CI Status Check & Log Fetcher

Automates the full workflow from branch detection to a local CI report using
`gh` CLI. Always pulls **all** job logs (not just failures) so the full
pipeline picture is available.

## Pipeline

Run scripts in order. Each script outputs JSON to stdout. Errors go to
stderr. Scripts are designed to chain: the JSON output of one feeds the
next.

Script paths must be anchored at the git root — this works from any CWD:

```bash
GIT_ROOT="$(git rev-parse --show-toplevel)"
SKILL_DIR="$GIT_ROOT/.agents/skills/tool-ci-check"
```

All four scripts source `_check-auth.sh` internally — no manual auth step is
needed.

### Step 0 — Detect the PR from the current branch

```bash
bash "$SKILL_DIR/scripts/s0-detect-pr.sh"
```

Output: `{"pr_number":"7","branch":"issue-6-xxx","found":true}`

If `found` is `false`, report the branch name to the user and ask which PR
to target. Proceed only when a PR number is determined.

### Step 1 — Check CI status

```bash
bash "$SKILL_DIR/scripts/s1-check-ci.sh" <pr_number>
```

Output: a JSON array of all checks — name, status, conclusion, workflowName,
detailsUrl, startedAt, completedAt.

Summarize the results to the user: a table of job name vs conclusion, with
a clear pass/fail/skipped indicator per job.

If the user only wants a status summary (no logs), stop here.

### Step 2 — Fetch all job logs

```bash
bash "$SKILL_DIR/scripts/s2-fetch-logs.sh" <branch> [run_id]
```

- `branch` — required, from s0 output
- `run_id` — optional; when omitted defaults to the latest run on the branch

What it does:
1. Resolves the run (latest or explicit)
2. Creates `.ai_dev/<branch>/ci/build-<id>-ts-<timestamp>/logs/`
3. Downloads every job log via `gh run view --log --job`
4. Writes `summary.json` with run metadata and per-job status
5. Outputs JSON with the `ci_dir` path

Output: `{"ci_dir":"/abs/path/.ai_dev/main/ci/build-123-ts-...","run_id":"123",...}`

The persistence directory is anchored at the git root (`git rev-parse
--show-toplevel`).  This works regardless of the current working directory.

### Step 3 — Generate the local report

```bash
bash "$SKILL_DIR/scripts/s3-generate-report.sh" <ci_dir>
```

Reads `summary.json`, fills the template from `assets/report-template.md`, and
runs `grep -n -C 10 -i` on failed job logs to produce the **Troubleshooting**
section.  The grep output includes line numbers so you can jump directly into
the relevant log file with Read.

Output: the path to `report.md`.

**After this step:**

1. Read `report.md` — check the Jobs table for pass/fail, then scan
   Troubleshooting for grep hits with line numbers.
2. For each failed job, use the line numbers as entry points: `Read(log_file,
   offset=<n - 5>, limit=<ctx + 20>)` to see the full context around the
   error.
3. Diagnose the root cause and present findings to the user.

## Authentication

Scripts check auth in this order:
1. `gh auth status` — interactive login (`gh auth login`)
2. `$GITHUB_TOKEN` env var — CI / token-based auth
3. `$GH_TOKEN` env var — fallback

If none are available, scripts fail early with a clear message.
On CI, set `$GITHUB_TOKEN` in the workflow (typically `${{ secrets.GITHUB_TOKEN }}`).
Locally, run `gh auth login` or export `GITHUB_TOKEN=<your-token>`.

## Directory structure

```
.agents/skills/tool-ci-check/
├── SKILL.md
├── assets/
│   └── report-template.md
├── references/
│   └── gh-ci-ref.md
└── scripts/
    ├── _check-auth.sh          # sourced by s0-s3
    ├── s0-detect-pr.sh
    ├── s1-check-ci.sh
    ├── s2-fetch-logs.sh
    └── s3-generate-report.sh
```

### Persistence (produced by s2 + s3)

```
.ai_dev/<branch>/ci/
└── build-25254392974-ts-20260502T144218/
    ├── logs/
    │   ├── build.log
    │   ├── lint.log
    │   ├── test.log
    │   └── type-check.log
    ├── summary.json
    └── report.md
```

## Data flow

```
s2: gh run view --log --job <id> → full .log files (under logs/)
s3: summary.json + .log files
      ├── cp assets/report-template.md → report.md
      ├── sed  __RUN_ID__, __TITLE__, ...  (scalar placeholders)
      ├── jq  → __JOB_TABLE__  + __LOG_LINKS__  (markdown tables)
      └── grep -n -C 10 -i -E '<error pattern>'  → __TROUBLESHOOTING__
          (line numbers + 10-line context per failed job)
```

## Common patterns

### Quick status check (steps 0-1 only)
When the user just wants to know CI state, run s0 + s1 and present the table.
Don't pull logs unless asked.

### Fetch logs after a push
After pushing to a PR branch, the user often wants to watch CI. Run s0, then
s1 to show status. If any jobs are still in_progress, tell the user and offer
to wait. Once completed, run s2 + s3 to persist logs.

### Investigating a specific failure
If the user points to a specific job failure, run the full pipeline (s0-s3).
The Troubleshooting section in report.md uses `grep -n -C 10 -i` to locate
error signatures with line numbers.  Use those line numbers to Read the full
log around each hit and diagnose the root cause.

## Reference

For the full `gh` CLI reference covering CI/run commands, read
[references/gh-ci-ref.md](references/gh-ci-ref.md).

## Script interface summary

| Script | Input | Output (stdout) |
|--------|-------|-----------------|
| `s0-detect-pr.sh` | none | `{"pr_number","branch","found"}` |
| `s1-check-ci.sh` | `<pr_number>` | JSON array of checks |
| `s2-fetch-logs.sh` | `<branch> [run_id]` | `{"ci_dir","run_id",...}` |
| `s3-generate-report.sh` | `<ci_dir>` | path to `report.md` |
