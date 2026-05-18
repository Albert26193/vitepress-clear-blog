---
title: 侧边栏与目录大纲详解
date: 2026-05-19
tags:
  - sidebar
  - outline
  - navigation
  - toc
description: 侧边栏显示模式、目录大纲深度、aside 面板与 frontmatter 控制
---

# 侧边栏与目录大纲详解

侧边栏和目录大纲是文档导航的核心组件。

## 侧边栏自动生成

VitePress 会根据目录结构自动生成侧边栏。在博客模式中，侧边栏显示同级和相邻目录的文档列表。

## frontmatter 控制侧边栏

在单个页面的 frontmatter 中：

```yaml
---
sidebar: false   # 隐藏整个侧边栏
aside: false     # 隐藏目录大纲面板
---
```

使用示例：

- 首页或 Landing 页面：`sidebar: false`
- Tags/Timeline 等组件页面：`aside: false, sidebar: false`
- 文档页面：不设置（默认显示侧边栏）

## 目录大纲（Outline）

目录大纲出现在页面右侧 aside 面板，自动提取 h2 和 h3 标题。

通过 frontmatter 控制大纲深度：

```yaml
---
outline: [2, 3]   # 显示 h2 和 h3
outline: [2]      # 仅显示 h2
outline: false    # 完全隐藏大纲
---
```

## [outline] config.toml 区块

在 `config.toml` 中配置大纲标题：

```toml
[outline]
title = "Table of Contents"  # 英文
# title = "目录"             # 中文
```

## 侧边栏背景色

通过 `config.toml` 的 `[theme]` 区块：

```toml
[theme]
vp-sidebar-bg-color = "#f3f3f3"

[theme.dark]
vp-sidebar-bg-color = "#181922"
```

## 相关文档

- [[../nav-bar-configuration|导航栏配置]]
- [[../../theme/color-scheme-config|颜色方案配置]]
- [[../page-layouts-overview|页面布局]]
