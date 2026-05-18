---
title: 主题颜色方案配置
date: 2026-05-22
tags:
  - theme
  - colors
  - css-variables
description: 详解 config.toml [theme] 区块中所有 CSS 变量及其视觉效果
---

# 主题颜色方案配置

`config.toml` 的 `[theme]` 区块提供了 9 个核心 CSS 变量，覆盖品牌色、文本色、背景色等关键视觉元素。

## 品牌色系统

### vp-c-brand（品牌主色）

用于链接、按钮、高亮、active 状态：

```toml
vp-c-brand = "#4259f3"     # 蓝色系（亮色）
vp-c-brand = "#94fe00ff"   # 绿色系（暗色）
```

### vp-c-brand-1（辅助品牌色）

用于 hover 状态、次要高亮：

```toml
vp-c-brand-1 = "#42a903"
```

## 背景与文本色

### vp-c-bg（页面背景）

影响整个页面和卡片的背景：

```toml
[theme]
vp-c-bg = "#fafafa"        # 浅灰白（亮色）

[theme.dark]
vp-c-bg = "#202127"        # 深灰蓝（暗色）
```

### vp-c-text-1（主文字色）

正文和标题的主要颜色：

```toml
[theme]
vp-c-text-1 = "#222"       # 深灰（亮色）

[theme.dark]
vp-c-text-1 = "#ccccccff"  # 浅灰（暗色）
```

### vp-button-brand-bg（按钮背景色）

影响主题按钮（如首页的导航按钮）：

```toml
[theme]
vp-button-brand-bg = "#129083"

[theme.dark]
vp-button-brand-bg = "#f2b983"
```

## 文本特殊颜色

### c-text-code（行内代码颜色）

行内代码 `` `code` `` 的文字颜色，独立于语法高亮：

```toml
c-text-code = "#305fef"     # 蓝色（亮色）
c-text-code = "#00ff00"     # 绿色（暗色）
```

### c-text-strong（粗体文本颜色）

**粗体文字** 的颜色：

```toml
c-text-strong = "#f00"      # 红色
```

### c-text-em（斜体文本颜色）

*斜体文字* 的颜色：

```toml
c-text-em = "#0000ff"       # 蓝色
```

## 侧边栏背景

```toml
[theme]
vp-sidebar-bg-color = "#f3f3f3"    # 浅灰（亮色）

[theme.dark]
vp-sidebar-bg-color = "#181922"    # 深色（暗色）
```

## 配置示例

完整配色方案：

```toml
[theme]
vp-c-bg = "#ffffff"
vp-c-brand = "#3b82f6"
vp-c-brand-1 = "#10b981"
vp-c-text-1 = "#1f2937"
vp-button-brand-bg = "#3b82f6"
c-text-code = "#ef4444"
c-text-strong = "#f59e0b"
c-text-em = "#8b5cf6"
vp-sidebar-bg-color = "#f9fafb"
```

## 相关文档

- [[../../customizing-theme|定制主题]]
- [[../dark-mode-customization|暗色模式]]
- [[../typography-and-fonts|排版字体]]
