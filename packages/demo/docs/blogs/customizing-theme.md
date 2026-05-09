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
footnote = true
```

All configuration is hot-reloaded during development.
