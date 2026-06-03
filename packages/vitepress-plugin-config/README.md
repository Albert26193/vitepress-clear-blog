# vitepress-plugin-config

A VitePress plugin that generates theme CSS variables from `.vitepress/config.toml`, enabling theme customization without editing source styles.

## Installation

```bash
npm install vitepress-plugin-config
```

## Usage

```ts
// .vitepress/config.ts
import { generateThemePlugin } from 'vitepress-plugin-config'

export default {
  vite: {
    plugins: [generateThemePlugin()]
  }
}
```

## Config File

Create `.vitepress/config.toml` in your VitePress site:

```toml
[theme]
vp-c-bg = "#ffffff"
vp-c-brand = "#3aa675"
vp-c-brand-1 = "#2e8b5a"
vp-c-text-1 = "#1a1a1a"
vp-button-brand-bg = "#3aa675"
c-text-code = "#c7254e"
c-text-strong = "#1a1a1a"
c-text-em = "#1a1a1a"
vp-sidebar-bg-color = "#f8f8f8"

[theme.dark]
vp-c-bg = "#0e1117"
vp-c-brand = "#3aa675"
vp-c-text-1 = "#e6e6e6"

[markdown.theme]
light = "github-light"
dark = "ayu-dark"
```

The plugin watches for changes during development and hot-reloads the theme CSS.

## API

```ts
import {
  clearConfigCache,
  loadConfig,
  validateConfigToml
} from 'vitepress-plugin-config'

// Load and validate .vitepress/config.toml
const config = loadConfig()

// Clear the config cache (useful for tests)
clearConfigCache()
```

## License

MIT
