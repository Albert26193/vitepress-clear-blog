---
title: Customizing Your Blog Theme
date: 2026-05-07
tags:
  - theme
  - customization
---

# Customizing Your Blog Theme

The `config.toml` file is the single source of truth for blog configuration.

## Site Metadata

```toml
[meta]
title = "My Blog"
description = "A personal blog"
author = "Your Name"
```

## Theme Colors

```toml
[theme]
vp-c-bg = "#fafafa"
vp-c-brand = "#4259f3"

[theme.dark]
vp-c-bg = "#202127"
vp-c-brand = "#94fe00ff"
```

## Navigation Labels

```toml
[nav]
home = "Home"
tags = "Tags"
timeline = "Timeline"
```

## Markdown Features

Enable or disable markdown extensions:

```toml
[markdown]
mathjax = true
mermaid = true
mermaid_render = "svg" # auto | ascii | svg
footnote = true
```

### Code Highlight Theme

Configure VitePress/Shiki code block themes directly in `config.toml`:

```toml
[markdown.theme]
light = "github-light"
dark = "ayu-dark"
```

You can also use one Shiki theme for all modes:

```toml
[markdown]
theme = "github-light"
```

When only `light` or `dark` is set, the missing mode falls back to the default theme.

Most configuration is hot-reloaded during development. Changing the Shiki highlight theme restarts the dev server so VitePress can rebuild its markdown highlighter.

## 延伸阅读

- [[theme/dark-mode-customization|暗色模式定制]]
- [[theme/color-scheme-config|主题颜色方案配置]]
- [[theme/typography-and-fonts|排版与字体]]
- [[theme/rss-seo-and-sitemap|RSS、SEO 与站点地图]]
- [[navigation/nav-bar-configuration|导航栏配置指南]]
- [[navigation/sidebar-and-outline|侧边栏与目录大纲]]
