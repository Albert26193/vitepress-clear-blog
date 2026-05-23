#!/usr/bin/env python3
"""Apply a pull plan: write kanban/github metadata from sync state into local issue Markdown files."""
import json
import os
import sys
from datetime import datetime, timezone

STATUS_MAP = {
    "Todo": "todo",
    "In Progress": "in_progress",
    "Done": "done",
    "Blocked": "blocked",
    "Discussion": "discussion",
}

def map_local_status(issue_state: str, kanban_status: str) -> str:
    if issue_state == "CLOSED":
        return "done"
    return STATUS_MAP.get(kanban_status, "todo")

def build_new_frontmatter(existing_raw: str, issue: dict) -> str:
    """Build the new frontmatter block by inserting new fields while preserving existing ones."""
    lines = []
    extra_keys = {"package", "type", "priority", "tags", "depends_on"}
    found_keys = set()
    remaining = existing_raw.strip().split("\n")

    # Helper: extract value for a given key from existing frontmatter lines
    def get_existing(key: str) -> str | None:
        for line in remaining:
            if line.startswith(f"{key}:"):
                return line[len(key) + 1:].strip()
        return None

    # Determine local status
    local_status = map_local_status(
        issue.get("state", "OPEN"),
        issue.get("kanban", {}).get("status", "Todo"),
    )

    # local_id from filename stem
    local_id = os.path.splitext(issue.get("file", ""))[0]

    # Build new lines in order
    # 1. package
    pkg = issue.get("package", "")
    if pkg:
        lines.append(f"package: {pkg}")
        found_keys.add("package")

    # 2. type
    t = issue.get("type", "")
    if t:
        lines.append(f"type: {t}")
        found_keys.add("type")

    # 3. priority
    pri = issue.get("priority", "")
    if pri:
        lines.append(f"priority: {pri}")
        found_keys.add("priority")

    # 4. status (new)
    lines.append(f"status: {local_status}")

    # 5. local_id (new)
    lines.append(f"local_id: {local_id}")

    # 6. tags
    tags = get_existing("tags")
    if tags:
        lines.append(f"tags: {tags}")
        found_keys.add("tags")
    else:
        tags_raw = issue.get("tags", "")
        if tags_raw:
            lines.append(f"tags: {tags_raw}")

    # 7. depends_on
    deps = get_existing("depends_on")
    if deps:
        lines.append(f"depends_on: {deps}")
        found_keys.add("depends_on")

    # 8. github block
    lines.append("github:")
    lines.append(f"  owner: Albert26193")
    lines.append(f"  repo: vitepress-theme-link")
    lines.append(f"  issue_number: {issue.get('issue_number', '')}")
    lines.append(f"  issue_url: {issue.get('issue_url', '')}")

    # 9. kanban block
    kanban = issue.get("kanban", {})
    lines.append("kanban:")
    lines.append(f"  project_owner: {kanban.get('project_owner', '')}")
    lines.append(f"  project_number: {kanban.get('project_number', '')}")
    lines.append(f"  item_id: {kanban.get('item_id', '')}")
    lines.append(f"  status_field_id: {kanban.get('status_field_id', '')}")
    lines.append(f"  status_option_id: {kanban.get('status_option_id', '')}")
    lines.append(f"  status: {kanban.get('status', '')}")
    lines.append(f"  priority_field_id: {kanban.get('priority_field_id', '')}")
    lines.append(f"  priority_option_id: {kanban.get('priority_option_id', '')}")
    lines.append(f"  priority: {kanban.get('priority', '')}")

    # 10. remote_updated_at
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines.append(f"remote_updated_at: {now}")

    return "\n".join(lines)


def apply_pull(sync_state_path: str, issues_dir: str, dry_run: bool = True) -> dict:
    """Apply the pull plan, writing metadata to local issue files."""
    with open(sync_state_path) as f:
        data = json.load(f)

    results = {
        "mode": "pull",
        "dry_run": dry_run,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
        "files": [],
    }

    for issue in data["issues"]:
        filename = issue["file"]
        filepath = os.path.join(issues_dir, filename)

        if not os.path.exists(filepath):
            results["errors"].append(f"Local file not found: {filename}")
            results["skipped"] += 1
            continue

        with open(filepath) as f:
            content = f.read()

        # Parse existing frontmatter
        parts = content.split("---\n", 2)
        if len(parts) < 3:
            results["errors"].append(f"Failed to parse frontmatter: {filename}")
            results["skipped"] += 1
            continue

        existing_fm = parts[1].strip()
        body = parts[2]

        new_fm = build_new_frontmatter(existing_fm, issue)
        new_content = f"---\n{new_fm}\n---{body}"

        if not dry_run:
            with open(filepath, "w") as f:
                f.write(new_content)

        local_status = map_local_status(
            issue.get("state", "OPEN"),
            issue.get("kanban", {}).get("status", "Todo"),
        )

        results["files"].append({
            "file": filename,
            "action": "update",
            "status": local_status,
            "issue_number": issue.get("issue_number"),
        })
        results["updated"] += 1

    return results


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Apply pull plan to local issue files")
    parser.add_argument("--sync-state", required=True, help="Path to sync state JSON")
    parser.add_argument("--issues-dir", required=True, help="Path to .ai_dev/issues/")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Dry run (no writes)")
    parser.add_argument("--apply", action="store_true", help="Actually write files")
    parser.add_argument("--confirm", default="", help="Confirmation token: remote-over-local")
    args = parser.parse_args()

    if args.apply and args.confirm != "remote-over-local":
        print("error: refusing to apply pull without --confirm remote-over-local", file=sys.stderr)
        print("Use --dry-run to preview changes first, then --apply --confirm remote-over-local")
        sys.exit(1)

    dry_run = not args.apply
    results = apply_pull(args.sync_state, args.issues_dir, dry_run=dry_run)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
