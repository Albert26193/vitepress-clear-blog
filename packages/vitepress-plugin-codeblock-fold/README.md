# vitepress-plugin-codeblock-fold

A VitePress plugin to automatically fold long code blocks.

## Installation

```bash
npm install vitepress-plugin-codeblock-fold
```

## Usage

In your `.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import setupCodeBlockFold from 'vitepress-plugin-codeblock-fold'
import 'vitepress-plugin-codeblock-fold/style.css'

export default {
  ...DefaultTheme,
  setup() {
    // ...
    setupCodeBlockFold({
      minHeight: 200, // default 200
      visibleHeight: 50 // default 50
    })
  }
}
```

## Options

- `minHeight`: The height threshold (in pixels) to trigger folding. Default is `200`.
- `visibleHeight`: The height (in pixels) of the collapsed code block. Default is `50`.
