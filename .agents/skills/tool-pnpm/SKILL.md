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
| `packages/theme/` | `vitepress-clear-blog` |
| `packages/testbed/` | `testbed` |
| `packages/demo/` | `demo` |
| `packages/intro/` | `intro` |
| `packages/create-blog-template/` | `create-blog-template` |
| `packages/vitepress-plugin-analyzer/` | `vitepress-plugin-analyzer` |
| `packages/vitepress-plugin-callout/` | `vitepress-plugin-callout` |
| `packages/vitepress-plugin-codeblock-fold/` | `vitepress-plugin-codeblock-fold` |
| `packages/vitepress-plugin-config/` | `vitepress-plugin-config` |
| `packages/vitepress-plugin-details-block/` | `vitepress-plugin-details-block` |
| `packages/vitepress-plugin-hashtag/` | `vitepress-plugin-hashtag` |

## Root scripts

These are defined in the root `package.json` and work from the repo root.

### Development

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
pnpm add lodash --filter vitepress-clear-blog
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
pnpm -F vitepress-clear-blog build

# Unit tests for one plugin
pnpm -F vitepress-plugin-analyzer test:unit

# Dev for one package
pnpm -F vitepress-clear-blog dev

# Run a single Playwright spec
pnpm -F vitepress-clear-blog test:e2e -- e2e/BlogMain.spec.ts
```

### Multi-package filtering

```bash
# Run in two specific packages
pnpm -F vitepress-clear-blog -F vitepress-plugin-callout build

# Run script recursively in all packages
pnpm -r <script>
```

## Common workflows

**Start developing:**
```bash
pnpm dev
```

**After changing plugin code — verify it builds:**
```bash
pnpm build:packages
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
pnpm build:packages && pnpm build:testbed && pnpm preview:testbed
```
