#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: scan local .ai_dev/issues markdown files into JSON records
#
# @param: --issues-dir DIR  Optional issue directory override
# @output: JSON array with path, slug, title, and raw frontmatter
# @return: 0 on success
#-----------------------------------------
function main {
  local dir=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --issues-dir)
        dir="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage_error "usage: s1-scan-local.sh [--issues-dir DIR]"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  if [[ -z "$dir" ]]; then
    dir="$(issues_dir)"
  fi

  python3 - "$dir" <<'PY'
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
items = []

for path in sorted(root.glob('*.md')):
    if path.name == 'README.md':
        continue
    text = path.read_text(encoding='utf-8')
    frontmatter = ''
    body = text
    if text.startswith('---\n'):
        end = text.find('\n---\n', 4)
        if end != -1:
            frontmatter = text[4:end]
            body = text[end + 5:]
    title_match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else path.stem
    items.append({
        'path': str(path),
        'file': path.name,
        'slug': path.stem,
        'title': title,
        'frontmatter_raw': frontmatter,
        'body': body.strip(),
    })

print(json.dumps(items, ensure_ascii=False, indent=2))
PY
}

main "$@"
