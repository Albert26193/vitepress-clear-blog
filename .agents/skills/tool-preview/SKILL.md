---
name: tool-preview
description: >
  Start a local VitePress preview server to visually inspect AI changes.
  Use this skill whenever the user asks to preview, start a dev server, see the
  result of changes, run a local preview, check the site in a browser, or wants
  to visually verify modifications — whether they say "预览", "起一下服务",
  "看看效果", "打开预览", "start preview", "run dev server", "preview the site",
  "起个预览", or any request to inspect rendered output. Also use it when the
  user finishes a code change and wants to see the visual result, or when the PR
  workflow needs a production-build preview for human review.
---

# Tool Preview

Start a local VitePress preview server for visually inspecting AI changes.

## How it works

The bundled `scripts/start-preview.sh` script handles everything:
port allocation → optional build → server start → URL detection → summary output.

The skill invokes this script and returns the preview URL to the user.

## Quick start

```bash
# Dev mode (fast, hot-reload) — default, great for iteration
bash .agents/skills/tool-preview/scripts/start-preview.sh

# Dev mode for a specific site
bash .agents/skills/tool-preview/scripts/start-preview.sh --site demo

# Production preview (build first, then serve static output)
bash .agents/skills/tool-preview/scripts/start-preview.sh --mode preview

# Specific port
bash .agents/skills/tool-preview/scripts/start-preview.sh --port 5099

# Preview without rebuilding (use existing dist)
bash .agents/skills/tool-preview/scripts/start-preview.sh --mode preview --no-build
```

## When to use which mode

| Scenario | Mode | Why |
|---|---|---|
| Editing content or code, want to see result quickly | `dev` (default) | Fast startup (~3-5s), hot-reload on file changes |
| About to submit a PR, need production-accurate check | `preview` | Builds and serves the exact output that deploys |
| build already ran, just want to serve it | `preview --no-build` | Skips rebuild, serves existing dist |

**Default to `dev` mode** unless the user specifically asks for a production build
or you're in the PR workflow Step 7.

## Site options

| Site | Description |
|---|---|
| `testbed` (default) | Main blog test site with full plugin setup |
| `demo` | Demo site with minimal configuration |
| `intro` | Introduction/documentation site |

## Port allocation

If no `--port` is given, the script auto-allocates a free port starting from **5000**,
incrementing upward until it finds one that isn't occupied. This avoids conflicts
when multiple agents or parallel previews are running.

To use a specific port:
```bash
bash .agents/skills/tool-preview/scripts/start-preview.sh --port 5180
```

## Important notes

- The preview server **keeps running** until explicitly stopped. The post-PR
  cleanup workflow (`tool-post-pr`) handles stopping repo-scoped processes.
- Multiple instances can run simultaneously on different ports — each call
  auto-allocates or accepts an explicit `--port`.
- The script uses the site's `package.json` scripts with `PORT` as an environment
  variable. Humans can also manually run: `PORT=5180 pnpm -F=testbed dev`

## Integration with other skills

- **workflow-git-pr** Step 7: calls this skill in `--mode preview` for the
  production-build human-review preview.
- **tool-post-pr**: automatically cleans up preview server processes via
  `/proc` scanning (matches `vitepress.*(dev|preview)` patterns).
- **tool-pnpm**: use `tool-pnpm` for build/install tasks before previewing.
