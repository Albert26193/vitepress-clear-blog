#!/usr/bin/env python3
"""Apply English translations to all 91 remote GitHub issues and local markdown files."""
import json
import os
import subprocess
import sys

# All English titles
TITLE_EN = {
    "ai-skills-ci.md": "Implement AI CI/CD helper skill",
    "ai-skills-coding.md": "Implement AI coding helper skill",
    "ai-skills-design.md": "Design AI Skills architecture",
    "ai-skills-issue.md": "Implement AI issue management skill",
    "ai-skills-system-discussion.md": "Design AI Skills taxonomy",
    "build-toolchain-consistency.md": "Unify plugin build toolchain (tsup vs vite build)",
    "ci-cd-setup.md": "Set up GitHub Actions CI pipeline",
    "docs-api-reference.md": "Write plugin API reference documentation",
    "docs-contributing.md": "Write CONTRIBUTING.md guide",
    "docs-plugin-readme.md": "Add README for each plugin",
    "docs-readme-enhance.md": "Improve project README",
    "e2e-test-setup.md": "Set up E2E test framework (Playwright)",
    "lint-staged-fix.md": "Fix lint-staged config referencing non-existent lint-fix script",
    "logging-build-output.md": "Implement structured build output logging",
    "logging-plugins-migration.md": "Migrate plugins to unified logging pipeline",
    "npm-publish-setup.md": "Configure npm publish workflow and version management",
    "pre-commit-hook.md": "Add pre-commit hook to run lint-staged",
    "test-coverage-threshold.md": "Set coverage thresholds and CI checks",
    "test-e2e-blog-flow.md": "E2E tests: blog browsing, search, tag filtering",
    "test-e2e-d3-graph.md": "E2E tests: D3 graph interaction and navigation",
    "test-e2e-dark-mode.md": "E2E tests: dark/light mode toggle",
    "test-e2e-responsive.md": "E2E tests: responsive layout breakpoint verification",
    "test-infra-unify.md": "Unify test framework configuration (vitest workspace)",
    "logging-system-discussion.md": "Design unified logging pipeline for theme package",
    "logging-theme-pipeline.md": "Design and implement unified logging pipeline for theme",
    "stats-analytics-integration.md": "Implement page view statistics integration",
    "stats-global-dashboard.md": "Implement global statistics dashboard",
    "stats-post-level.md": "Implement per-post statistics",
    "test-theme-composables.md": "Add unit tests for theme composables",
    "test-theme-unit.md": "Add unit tests for theme package",
    "theme-collections-component.md": "Implement Collections.vue component",
    "theme-comment-system.md": "Add toggleable comment system",
    "theme-copyright-config.md": "Make Copyright component ICP number and theme link configurable",
    "theme-d3-custom-collision.md": "Implement custom collision detection for D3ForceGraph",
    "theme-d3-dedup-fullscreen-homepage.md": "Deduplicate D3FullScreen and D3HomePage shared code",
    "theme-d3-interaction.md": "Implement d3Interaction.ts",
    "theme-d3-local-graph.md": "Implement local graph component",
    "theme-d3-node-group-coloring.md": "Implement D3 graph node group coloring",
    "theme-d3-performance.md": "Optimize D3 graph performance for large node counts",
    "theme-docbanner-mobile-tags.md": "Handle DocBanner mobile tag overflow",
    "theme-empty-sidebars.md": "Populate or remove empty sidebar configs for both sites",
    "theme-fix-apply-duplicate.md": "Fix duplicate @apply directives in BlogCardItem and HideSidebarButton",
    "theme-fix-docbanner-redundant.md": "Fix redundant if/else branch in DocBanner",
    "theme-fix-drag-delta.md": "Fix D3ForceGraph drag delta divided by 1000 making nodes nearly immovable",
    "theme-fix-heti-type-dedup.md": "Remove duplicate heti type declarations",
    "theme-fix-postmermaid-ts.md": "Add lang=\"ts\" to PostMermaid.vue",
    "theme-fix-valid-css-values.md": "Fix non-standard UnoCSS class names",
    "theme-footnoteref-responsive.md": "Implement FooterRef responsive tooltip positioning",
    "theme-nav-pages-targets.md": "Create missing navigation target pages",
    "theme-placeholder-values.md": "Replace all placeholder values in docs site",
    "theme-rss-activation.md": "Activate RSS plugin config and full-text output",
    "theme-search-enhancement.md": "Search experience optimization",
    "theme-wikilinks-baseurl.md": "Fix hardcoded LAN IP baseURL in WikiLinks",
    "analyzer-async-fs.md": "Replace synchronous file I/O with async in analyzer",
    "analyzer-client-api.md": "Export analyzer client API types",
    "analyzer-config-fix.md": "Fix || vs ?? semantics in analyzer config merging",
    "analyzer-directory-index.md": "Add directory-level index.md/README.md resolution",
    "analyzer-error-handling.md": "Add error handling for analyzer file system operations",
    "analyzer-logger.md": "Implement analyzer plugin logging module",
    "analyzer-search-depth.md": "Implement maxSearchDepth configuration option",
    "analyzer-test-expansion.md": "Expand analyzer test coverage",
    "analyzer-test-script.md": "Add test script for analyzer",
    "analyzer-vm-cache.md": "Add caching for analyzer virtual modules",
    "callout-config-options.md": "Add custom preset override config for callout",
    "callout-styles.md": "Improve callout CSS styles",
    "callout-tests.md": "Write unit tests for callout plugin",
    "callout-ts-types.md": "Add explicit markdown-it TypeScript types to callout plugin",
    "callout-vitepress-wrapper.md": "Add VitePress plugin wrapper for callout",
    "codeblock-fold-a11y.md": "Add accessibility attributes to fold button",
    "codeblock-fold-css-override.md": "Allow consumers to override fold button styles",
    "codeblock-fold-mutation-observer.md": "Replace setTimeout with MutationObserver for code block detection",
    "codeblock-fold-options.md": "Separate visibleHeight and minHeight config options",
    "codeblock-fold-resize-observer.md": "Add ResizeObserver to respond to window resize",
    "codeblock-fold-tests.md": "Write unit tests for codeblock-fold plugin",
    "config-dedup-constants.md": "Deduplicate path constants between config.ts and node.ts",
    "config-dynamic-css-vars.md": "Refactor config plugin for dynamic CSS variable generation",
    "config-hmr-race-condition.md": "Fix 100ms setTimeout race condition in config HMR",
    "config-meta-page-sections.md": "Implement meta/page config section application from TOML",
    "config-remove-important.md": "Remove !important from CSS custom properties",
    "config-tests.md": "Write unit tests for config plugin",
    "config-toml-validation.md": "Add TOML config validation and error reporting",
    "config-tsup-externalize.md": "Properly externalize vitepress in tsup",
    "details-block-a11y.md": "Add aria attributes and keyboard interaction for details-block",
    "details-block-i18n.md": "Add i18n support for details-block summary text",
    "details-block-tests.md": "Write unit tests for details-block component",
    "details-block-tsup-migration.md": "Migrate details-block build from vite build to tsup",
    "details-block-vitepress-plugin.md": "Implement details-block VitePress markdown container integration",
    "hashtag-docs.md": "Write documentation for hashtag plugin",
    "hashtag-implementation.md": "Implement hashtag plugin core functionality",
    "hashtag-tests.md": "Write tests for hashtag plugin",
    "docs-intro-content.md": "Improve intro documentation site content",
}


def update_remote_issue(issue_number, title, body):
    """Update a GitHub issue title and body via gh CLI."""
    try:
        cmd = [
            "gh", "issue", "edit", str(issue_number),
            "--repo", "Albert26193/vitepress-clear-blog",
            "--title", title,
            "--body", body,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return False, result.stderr.strip()
        return True, ""
    except Exception as e:
        return False, str(e)


def translate_body(cn_body):
    """Translate Chinese body sections to English using pattern replacement."""
    # Section headers
    body = cn_body
    body = body.replace("## 验收标准", "## Acceptance Criteria")
    body = body.replace("## 备注", "## Notes")
    body = body.replace("## 讨论要点", "## Discussion Points")
    return body


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--sync-state", required=True)
    parser.add_argument("--issues-dir", required=True)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--confirm", default="")
    args = parser.parse_args()

    if args.apply and args.confirm != "translate-all-issues":
        print("error: use --confirm translate-all-issues", file=sys.stderr)
        sys.exit(1)

    with open(args.sync_state) as f:
        data = json.load(f)

    results = {"titles": 0, "remote_updated": 0, "local_updated": 0, "errors": []}

    for issue in data["issues"]:
        filename = issue["file"]
        issue_number = issue.get("issue_number")
        if not issue_number:
            continue

        en_title = TITLE_EN.get(filename)
        if not en_title:
            results["errors"].append(f"No title: {filename}")
            continue

        cn_body = issue.get("body_content", "")
        en_body = translate_body(cn_body)

        if args.apply:
            ok, err = update_remote_issue(issue_number, en_title, en_body)
            if ok:
                results["remote_updated"] += 1
            else:
                results["errors"].append(f"Failed #{issue_number} {filename}: {err}")
                continue

        # Update local file title (H1)
        filepath = os.path.join(args.issues_dir, filename)
        if os.path.exists(filepath):
            with open(filepath) as f:
                content = f.read()

            # Replace H1 title
            import re
            content = re.sub(r'^# .*$', f'# {en_title}', content, count=1, flags=re.MULTILINE)

            # Translate section headers in body
            content = content.replace("## 验收标准", "## Acceptance Criteria")
            content = content.replace("## 备注", "## Notes")
            content = content.replace("## 讨论要点", "## Discussion Points")

            if args.apply:
                with open(filepath, 'w') as f:
                    f.write(content)
                results["local_updated"] += 1

        results["titles"] += 1

    print(f"Titles translated: {results['titles']}")
    print(f"Remote updated: {results['remote_updated']}")
    print(f"Local updated: {results['local_updated']}")
    if results["errors"]:
        print(f"Errors: {len(results['errors'])}")
        for e in results["errors"][:10]:
            print(f"  {e}")


if __name__ == "__main__":
    main()
