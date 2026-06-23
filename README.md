# vitepress-theme-link

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/Albert26193/vitepress-theme-link/actions/workflows/ci.yml/badge.svg)](https://github.com/Albert26193/vitepress-theme-link/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)](https://pnpm.io/)

A customizable VitePress blog theme with plugin architecture.

Forked from [vitepress-blog-pure](https://github.com/airene/vitepress-blog-pure).

## Quick Start

Scaffold a new blog with one command:

```bash
npm create vitepress-theme-link@latest my-blog   # npm
pnpm create vitepress-theme-link@latest my-blog  # pnpm
yarn create vitepress-theme-link my-blog         # yarn
bun create vitepress-theme-link@latest my-blog   # bun
```

For beta releases, use the beta dist-tag explicitly:

```bash
npm create vitepress-theme-link@beta my-blog
pnpm create vitepress-theme-link@beta my-blog
```

Then install dependencies and start the dev server:

```bash
cd my-blog
pnpm install
pnpm dev
```

> **Tip**: The scaffold auto-detects your package manager and prints the exact
> commands to run. Add `.md` files under `docs/` — see `docs/example.md` for a
> minimal post with frontmatter.

### Local development (before npm publish)

From the monorepo root, link the scaffold package globally:

```bash
cd packages/create-vitepress-theme-link && npm link
```

Then scaffold a new blog anywhere with `npx`:

```bash
npx create-vitepress-theme-link my-blog
```

Or run the CLI directly without linking:

```bash
node packages/create-vitepress-theme-link/bin/create-vitepress-theme-link.js my-blog
```

## Features

- Clean VitePress blog theme with responsive layouts
- Wiki-style links and backlinks for connected notes
- Interactive D3 graph for content relationships
- Markdown callouts, details blocks, hashtags, and code folding
- Mermaid diagrams and math-friendly writing support
- RSS and blog metadata support
- Reusable plugin packages for independent adoption

## Project Structure

```text
vitepress-theme-link/
├── packages/
│   ├── create-vitepress-theme-link/            # Project scaffold CLI
│   ├── theme/                                  # VitePress blog theme (vitepress-theme-link)
│   ├── vitepress-plugin-analyzer/              # Content analysis and graph data
│   ├── vitepress-plugin-callout/               # Markdown callout blocks
│   ├── vitepress-plugin-callouts/              # Markdown callout blocks (alternative)
│   ├── vitepress-plugin-codeblock-fold/        # Foldable code blocks
│   ├── vitepress-plugin-config/                # Shared config utilities
│   ├── vitepress-plugin-details-block/         # Details/summary blocks
│   ├── vitepress-plugin-hashtag/               # Hashtag support
│   └── vitepress-plugin-image-dimension/       # Image dimension support
├── sites/
│   ├── demo/                                   # Public demo site
│   ├── intro/                                  # Project introduction site
│   └── testbed/                                # Theme dev and test site
├── .github/workflows/                          # CI/CD pipelines
├── package.json
└── pnpm-workspace.yaml
```

## Environment Requirements

- **Node.js**: >= 22.0.0
- **pnpm**: >= 9.0.0

## Development

```bash
# Install dependencies
pnpm install

# Start all packages in development mode
pnpm dev

# Build from clean
pnpm build

# Build all packages only
pnpm build:packages

# Build and preview the testbed site
pnpm build:testbed
pnpm preview:testbed

# Run full test suite (unit + e2e)
pnpm test

# Run unit tests only
pnpm test:unit

# Run e2e tests only
pnpm test:e2e

# Type-check
pnpm typecheck

# Lint and format
pnpm lint
pnpm format
```

## Beta release

Set the next lockstep beta version, then commit that version change separately from release tooling changes:

```bash
pnpm release:version 0.1.0-beta.0
```

Before publishing, run the local release dry-run gate:

```bash
pnpm install --frozen-lockfile
pnpm lint
git diff --exit-code
pnpm typecheck
pnpm test:unit
pnpm build
pnpm validate:packages
pnpm validate:consumer
pnpm release:check -- --version 0.1.0-beta.0 --require-build
pnpm release:publish:beta -- --version 0.1.0-beta.0
```

Then trigger the `Publish npm beta` GitHub Actions workflow. Keep `dry_run=true` for validation-only runs. For a real publish, set `dry_run=false` and `confirm=publish-0.1.0-beta.0-to-npm-beta`.

The beta workflow and release scripts publish only with `--tag beta`; they must not publish `latest`.

## License

MIT
