# vitepress-plugin-config

A VitePress plugin that generates theme CSS variables from a TOML config file,
enabling theme customization without editing source styles.

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

By default it reads `config.toml` from the project root. Pass a custom path:

```ts
generateThemePlugin('custom/config.toml')
```

## Config File

Create a `config.toml` in your project root:

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
```

The plugin watches for changes during development and hot-reloads the theme CSS.

## API

```ts
import { loadConfig, clearConfigCache, validateConfigToml } from 'vitepress-plugin-config'

// Load and validate a TOML config
const config = loadConfig('config.toml')

// Clear the config cache (useful for tests)
clearConfigCache()
```

## License

MIT
