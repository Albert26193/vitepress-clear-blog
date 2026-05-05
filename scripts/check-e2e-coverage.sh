#!/usr/bin/env bash
set -euo pipefail

# Check that every .vue component in the theme package has a matching E2E spec file.
# Usage: bash scripts/check-e2e-coverage.sh
# Exit 0: all components covered
# Exit 1: one or more components missing E2E coverage

THEME_DIR="packages/theme/src/components"
E2E_DIR="packages/theme/e2e"

[[ -d "$THEME_DIR" ]] || { echo "error: $THEME_DIR not found"; exit 1; }
[[ -d "$E2E_DIR" ]] || { echo "error: $E2E_DIR not found"; exit 1; }

missing=0
covered=0

echo "E2E Coverage Check"
echo "=================="
echo ""

while IFS= read -r -d '' vue_file; do
  component_name="$(basename "$vue_file" .vue)"
  spec_file="$E2E_DIR/${component_name}.spec.ts"

  if [[ -f "$spec_file" ]]; then
    echo "  ✅ $component_name"
    covered=$((covered + 1))
  else
    echo "  ❌ $component_name  — missing $E2E_DIR/${component_name}.spec.ts"
    missing=$((missing + 1))
  fi
done < <(find "$THEME_DIR" -name "*.vue" -print0 | sort -z)

echo ""
echo "Covered:  $covered"
echo "Missing:  $missing"
echo "Total:    $((covered + missing))"

if [[ "$missing" -gt 0 ]]; then
  echo ""
  echo "FAIL: $missing component(s) lack E2E coverage."
  echo "Create a spec file at $E2E_DIR/<ComponentName>.spec.ts for each missing component."
  exit 1
fi

echo "PASS: all components have E2E coverage."
exit 0
