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

`visibleHeight` should be smaller than `minHeight`; otherwise folded code blocks may not appear visually collapsed.

## Style customization

Importing `vitepress-plugin-codeblock-fold/style.css` is required. Override the `--vp-code-fold-*` CSS variables in your theme styles to customize the fold mask and button.

```css
:root {
  --vp-code-fold-btn-hover-color: var(--vp-c-brand);
  --vp-code-fold-btn-bg: var(--vp-c-bg-soft);
  --vp-code-fold-btn-color: var(--vp-c-text-2);
  --vp-code-fold-btn-size: 24px;
  --vp-code-fold-active-mask-bg: linear-gradient(
    to bottom,
    transparent 0%,
    var(--vp-c-bg) 80%
  );
  --vp-code-fold-expanded-padding-bottom: 28px;
}
```
