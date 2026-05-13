#!/bin/bash
# =============================================================================
# analyze-diff.sh
# Analyse staged + unstaged changes and output JSON metadata for the workflow.
#
# Output: JSON with scope, package_label, changed_files, packages, suggested_type.
#   scope  — Conventional Commits scope (theme|docs|plugin-*|null)
#   package_label — GitHub label (package:theme|package:docs|package:plugin-*|package:root)
#   suggested_type — best-guess commit type (feat|fix|docs|chore)
#
# Usage:
#   ./analyze-diff.sh
# =============================================================================

set -euo pipefail

# --------------------------------------------------------------------------
# Path → scope mapping (most-specific first)
# --------------------------------------------------------------------------
declare -A PKG
PKG=(
    ["packages/theme/"]="theme"
    ["packages/testbed/"]="testbed"
    ["packages/vitepress-plugin-analyzer/"]="plugin-analyzer"
    ["packages/vitepress-plugin-callout/"]="plugin-callout"
    ["packages/vitepress-plugin-codeblock-fold/"]="plugin-codeblock-fold"
    ["packages/vitepress-plugin-config/"]="plugin-config"
    ["packages/vitepress-plugin-details-block/"]="plugin-details-block"
    ["packages/vitepress-plugin-hashtag/"]="plugin-hashtag"
)

# --------------------------------------------------------------------------
# collect_paths — emit all changed paths (staged + unstaged + untracked)
# --------------------------------------------------------------------------
collect_paths() {
    {
        git diff --cached --name-only 2>/dev/null || true
        git diff --name-only 2>/dev/null || true
        git ls-files --others --exclude-standard 2>/dev/null || true
    } | sort -u
}

# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
main() {
    local paths_tmp
    paths_tmp="$(mktemp)"
    collect_paths > "$paths_tmp"

    local count
    count="$(wc -l < "$paths_tmp")"

    if [[ "$count" -eq 0 ]]; then
        printf '{"error":"no changes detected"}\n'
        rm -f "$paths_tmp"
        exit 0
    fi

    local matched_pkg=""
    local -a unique_pkgs=()
    local has_new=false
    local all_docs=true

    while IFS= read -r path; do
        # Check if new file via per-file status
        local status
        status="$(git status --porcelain "$path" 2>/dev/null || true)"
        if [[ "$status" =~ ^(\?\?| ?A) ]]; then
            has_new=true
        fi
        # Check if non-doc (only markdown count as docs)
        [[ "$path" =~ \.(md|mdx)$ ]] || all_docs=false

        # Match package
        for prefix in "${!PKG[@]}"; do
            if [[ "$path" == "$prefix"* ]]; then
                local p="${PKG[$prefix]}"
                [[ -z "$matched_pkg" ]] && matched_pkg="$p"
                local found=false
                for up in "${unique_pkgs[@]}"; do
                    [[ "$up" == "$p" ]] && found=true && break
                done
                $found || unique_pkgs+=("$p")
                break
            fi
        done
    done < "$paths_tmp"
    rm -f "$paths_tmp"

    # Determine scope and package label
    local scope="null"
    local pkg_label="package:root"
    if [[ ${#unique_pkgs[@]} -eq 1 ]]; then
        scope="\"$matched_pkg\""
        pkg_label="package:${matched_pkg}"
    elif [[ ${#unique_pkgs[@]} -gt 1 ]]; then
        scope="null"
        pkg_label="package:root"
    else
        scope="null"
        pkg_label="package:root"
    fi

    # Build packages JSON array
    local pkgs_json="["
    local pkg_first=true
    for p in "${unique_pkgs[@]}"; do
        $pkg_first && pkg_first=false || pkgs_json+=","
        pkgs_json+="\"$p\""
    done
    pkgs_json+="]"

    # Suggest type
    local stype="chore"
    if $all_docs && $has_new; then
        stype="docs"
    elif $has_new; then
        stype="feat"
    elif ! $all_docs; then
        stype="fix"
    fi

    printf '{"scope":%s,"package_label":"%s","changed_files":%d,"packages":%s,"suggested_type":"%s"}\n' \
        "$scope" "$pkg_label" "$count" "$pkgs_json" "$stype"
}

main "$@"
