# vitepress-plugin-analyzer

A build-time Markdown analyzer that scans the docs directory, resolves page links, and
exposes site metadata through a Vite virtual module consumed by the theme.

## Installation

```bash
npm install vitepress-plugin-analyzer
```

## Usage

```ts
// .vitepress/config.ts
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'

export default {
  vite: {
    plugins: [vitePressAnalyzerPlugin()]
  }
}
```

## Configuration

All options are optional with sensible defaults:

```ts
vitePressAnalyzerPlugin({
  docsDir: 'docs',                          // root directory for markdown files
  excludeDirs: ['node_modules', '.git'],    // directories to skip
  includeFiles: ['.md'],                    // file extensions to process
  excludeFiles: [],                         // specific files to skip
  ignoreCase: true,                         // case-insensitive link matching
  resolutionModes: ['repoRoot', 'absolutePath', 'relativeToCurrentFile'],
  logLevel: 'warn'                          // silent | error | warn | info | debug
})
```

Set `VITEPRESS_ANALYZER_LOG_LEVEL` (or `ANALYZER_LOG_LEVEL`) to override the default
log level at runtime.

## How It Works

| Step | Description |
|------|-------------|
| Scan | Recursively reads markdown files from `docsDir` |
| Parse | Extracts headings, links (markdown and wiki), word count |
| Resolve | Resolves relative links to absolute paths using configurable modes |
| Expose | Virtual module `virtual:vitepress-analyzer` provides `siteMetadata` and `sitePages` |

The theme imports the virtual module to render backlinks, tag pages, and site graphs.

## License

MIT
