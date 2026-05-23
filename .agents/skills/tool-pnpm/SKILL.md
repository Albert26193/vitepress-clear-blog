---
name: tool-pnpm
description: >
  Run pnpm commands for this monorepo. Use this skill whenever the user asks to
  install dependencies, add/remove/update packages, run dev/build/test scripts, or
  manage the pnpm workspace — whether they say "pnpm", "装包", "加依赖", "更新依赖",
  "add dependency", "install package", "run script", "dev", "build", "clean", or any
  package-management operation. Also use it when the user is unsure which command to
  use or what a root script does.
---

# pnpm Monorepo Command Reference

All commands run from the repo root unless noted otherwise.

## Package registry

Use the **package.json `name`** (not directory name) with `-F` / `--filter`.

| Directory | `name` in package.json |
|---|---|
| `packages/theme/` | `vitepress-theme-link` |
| `packages/testbed/` | `testbed` |
| `packages/demo/` | `demo` |
| `packages/intro/` | `intro` |
| `packages/create-vitepress-theme-link/` | `create-vitepress-theme-link` |
| `packages/vitepress-plugin-analyzer/` | `vitepress-plugin-analyzer` |
| `packages/vitepress-plugin-callouts/` | `vitepress-plugin-callouts` |
| `packages/vitepress-plugin-codeblock-fold/` | `vitepress-plugin-codeblock-fold` |
| `packages/vitepress-plugin-config/` | `vitepress-plugin-config` |
| `packages/vitepress-plugin-details-block/` | `vitepress-plugin-details-block` |
| `packages/vitepress-plugin-hashtag/` | `vitepress-plugin-hashtag` |

## Root scripts

These are defined in the root `package.json` and work from the repo root.

### Development

> **Monorepo requirement**: Always run `pnpm build` before the first `pnpm dev`.
> This project has 11 interdependent packages — testbed needs the theme's `lib/`
> output, plugins reference each other's types, and `tsup --watch` only rebuilds
> on changes, not on initial startup. Skipping the initial build causes missing
> module errors and broken imports.
>
> ```bash
> pnpm build && pnpm dev
> ```

| Task | Command | What it does |
|---|---|---|
| Dev all | `pnpm dev` | Starts packages (watch mode) + testbed dev server in parallel |
| Dev testbed only | `pnpm dev:testbed` | VitePress dev server for the testbed site |
| Dev packages only | `pnpm dev:packages` | All packages in parallel watch mode |
| Watch UnoCSS | `pnpm dev:unocss` | Regenerate UnoCSS output on source changes |

### Build

| Task | Command | What it does |
|---|---|---|
| Build all | `pnpm build` | Clean + build all packages |
| Build packages | `pnpm build:packages` | Recursive build across all packages |
| Build testbed | `pnpm build:testbed` | VitePress build for testbed |
| Build UnoCSS | `pnpm build:unocss` | One-shot UnoCSS generation |

### Clean

| Task | Command | What it does |
|---|---|---|
| Clean all | `pnpm clean` | Recursive clean across all packages |
| Clean testbed | `pnpm clean:testbed` | Clear VitePress cache + dist from testbed |

### Test

| Task | Command | What it does |
|---|---|---|
| Full suite | `pnpm test` | Unit + E2E (slow — prefer targeted checks) |
| Unit only | `pnpm test:unit` | Recursive `test:unit` across all packages |
| E2E only | `pnpm test:e2e` | Playwright tests in the theme package |
| Test UI | `pnpm test:ui` | Vitest UI across all packages |

### Code quality

| Task | Command | What it does |
|---|---|---|
| Lint + fix | `pnpm lint` | ESLint across all packages (mutating — applies `--fix`) |
| Lint read-only | `pnpm exec eslint './packages/**/*.{ts,tsx,js,jsx,vue}'` | ESLint without writing |
| Format | `pnpm format` | Prettier across entire repo |
| Typecheck | `pnpm typecheck` | Build packages then run `tsc --noEmit` |

### Other

| Task | Command |
|---|---|
| Preview built testbed | `pnpm preview:testbed` |
| Build preview testbed | `bash .agents/skills/tool-pnpm/scripts/build_preview.sh` |
| Generate changelog | `pnpm changelog` |

## Dependency management

### Install

```bash
pnpm install
```

### Add a dependency

```bash
# Root devDependency
pnpm add <pkg> -w -D

# Specific package (dependency)
pnpm add <pkg> --filter <package-name>

# Specific package (devDependency)
pnpm add <pkg> -D --filter <package-name>
```

Examples:

```bash
pnpm add lodash --filter vitepress-theme-link
pnpm add @types/node -D --filter vitepress-plugin-analyzer
```

### Remove

```bash
pnpm remove <pkg> --filter <package-name>
```

### Update

```bash
# See what's outdated across the workspace
pnpm outdated -r

# Update all packages to latest
pnpm update -r --latest

# Update one package
pnpm update <pkg> --latest
```

## Package filtering

Run any package script via the filter flag:

```bash
pnpm -F <package-name> <script>
```

Examples:

```bash
# Build only the theme
pnpm -F vitepress-theme-link build

# Unit tests for one plugin
pnpm -F vitepress-plugin-analyzer test:unit

# Dev for one package
pnpm -F vitepress-theme-link dev

# Run a single Playwright spec
pnpm -F vitepress-theme-link test:e2e -- e2e/BlogMain.spec.ts
```

### Multi-package filtering

```bash
# Run in two specific packages
pnpm -F vitepress-theme-link -F vitepress-plugin-callouts build

# Run script recursively in all packages
pnpm -r <script>
```

## Common workflows

**Start developing (first time or after clean):**
```bash
pnpm build && pnpm dev
```

**Start developing (already built, just need watch):**
```bash
pnpm dev
```

**After changing plugin code — rebuild before re-entering dev:**
```bash
pnpm build:packages && pnpm dev
```

**Quick local validation before commit:**
```bash
pnpm test:unit
```

**Full CI check locally:**
```bash
pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build
```

**Add a dependency to one plugin:**
```bash
pnpm add some-lib --filter vitepress-plugin-xxx
```

**Rebuild and preview testbed after theme changes:**
```bash
bash .agents/skills/tool-pnpm/scripts/build_preview.sh
```

Use this for human-facing local verification because it previews the built VitePress output and keeps the preview server running for browser review. The preview is intentionally long-lived; stop it through the post-PR cleanup workflow when the PR is merged, abandoned, or no longer needs visual inspection.

## Stopping dev / cleanup

`pnpm dev` starts ~15-20 subprocesses (tsup watchers, vite build watchers, cpx file copiers,
esbuild services, vitepress dev servers). A plain `kill` on the top-level PID or `Ctrl+C`
may not propagate to the entire tree, leaving orphaned watchers that continue to consume
file descriptors and inotify watches.

### Check for stale dev processes

```bash
# Count running watchers from this project
ps aux | grep -E "(vitepress dev|vite build --watch|tsup.*--watch|cpx.*-w)" | grep -v grep | wc -l

# See the full process tree
ps aux --forest | grep -E "(pnpm|vite|tsup|cpx|vitepress|esbuild)" | grep -v grep
```

### Kill all stale watchers

```bash
# Kill everything related to this project's dev processes
pkill -f "vitepress dev" 2>/dev/null || true
pkill -f "vite build --watch" 2>/dev/null || true
pkill -f "tsup.*--watch" 2>/dev/null || true
pkill -f "cpx.*-w" 2>/dev/null || true
```

Or target a specific worktree:

```bash
ps aux | grep "vitepress-theme-link" | grep -v grep | \
  grep -E "(pnpm|vite|tsup|cpx|vitepress|esbuild)" | \
  awk '{print $2}' | xargs kill -9 2>/dev/null
```

### EMFILE troubleshooting

If you see `EMFILE: too many open files` during `pnpm dev`, check for stale
watchers **before** increasing `ulimit -n`. Accumulated orphan processes from
previous dev sessions are the most common cause.

```bash
# Check your limit
ulimit -n

# Check inotify watch limit
cat /proc/sys/fs/inotify/max_user_watches

# See current open file count
lsof 2>/dev/null | wc -l
```

### Safe dev workflow: pre-clean + run + post-clean

Always follow the two-guard pattern: clean up stale processes **before** starting,
then ensure everything is killed **after**.

```bash
# 1. PRE-CLEAN — kill any leftover watchers from previous sessions
ps aux | grep "vitepress-theme-link" | grep -v grep | \
  grep -E "(pnpm|vite|tsup|cpx|vitepress|esbuild)" | \
  awk '{print $2}' | xargs kill -9 2>/dev/null

# 2. RUN — start dev (Ctrl+C to stop when done)
pnpm dev

# 3. POST-CLEAN — verify nothing is left behind
ps aux | grep -E "(vitepress dev|vite build --watch|tsup.*--watch|cpx.*-w)" | grep -v grep | wc -l
# Expected output: 0
```

If `Ctrl+C` doesn't propagate to the entire tree, kill by process group:

```bash
# Find the PGID and kill the entire tree
ps -o pgid= -p <pnpm-dev-pid> | tr -d ' ' | xargs kill -TERM --
```
