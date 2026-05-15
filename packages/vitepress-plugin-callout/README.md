# vitepress-plugin-callout

A VitePress markdown-it plugin that adds support for custom callout block types
beyond the built-in presets.

## Installation

```bash
npm install vitepress-plugin-callout
```

## Usage

```ts
import MarkdownIt from 'markdown-it'
import { calloutPlugin } from 'vitepress-plugin-callout'

const md = new MarkdownIt()
md.use(calloutPlugin, {
  types: {
    question: { title: 'Question' },
    example: { title: 'Example' }
  }
})
```

## Markdown Syntax

Use the standard VitePress callout syntax with any custom type:

```markdown
> [!question] What is this?
> This is a custom callout with a question title.

> [!example]
> An example callout using the default title from config.
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `types` | `Record<string, { title?: string }>` | `{}` | Custom callout type definitions |
| `overridePresets` | `boolean` | `false` | When true, also handles preset types (tip, note, info, etc.) |

Preset callout types (`tip`, `note`, `info`, `important`, `warning`, `caution`, `danger`)
are left for VitePress unless `overridePresets` is enabled.

## License

MIT
