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
npm create blog-template@latest my-blog   # npm
pnpm create blog-template@latest my-blog  # pnpm
yarn create blog-template my-blog         # yarn
bun create blog-template@latest my-blog   # bun
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
│   ├── theme/                           # VitePress blog theme (vitepress-theme-link)
│   ├── testbed/                         # Theme demo and development site
│   ├── demo/                            # Public demo site
│   ├── intro/                           # Project introduction and docs site
│   ├── vitepress-plugin-analyzer/       # Content analysis and graph data
│   ├── vitepress-plugin-callouts/        # Markdown callout blocks
│   ├── vitepress-plugin-codeblock-fold/ # Foldable code blocks
│   ├── vitepress-plugin-config/         # Shared config utilities
│   ├── vitepress-plugin-details-block/  # Details/summary blocks
│   └── vitepress-plugin-hashtag/        # Hashtag support
├── .github/workflows/                   # CI/CD pipelines
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

# Build all packages
pnpm build:packages

# Build and preview the testbed site
pnpm build:testbed
pnpm preview:testbed

# Run tests
pnpm test:unit

# Lint and format
pnpm lint
pnpm format
```

## License

MIT
