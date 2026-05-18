---
title: 暗色模式定制指南
date: 2026-05-21
tags:
  - theme
  - dark-mode
  - customization
description: 通过 config.toml [theme.dark] 定制暗色模式的颜色方案
---

# 暗色模式定制指南

VitePress 内置了亮/暗模式切换功能，通过 `config.toml` 的 `[theme.dark]` 区块可以完全自定义暗色模式的颜色方案。

## 基础配置

```toml
[theme]
# 亮色模式颜色
vp-c-bg = "#fafafa"
vp-c-brand = "#4259f3"

[theme.dark]
# 暗色模式颜色
vp-c-bg = "#202127"
vp-c-brand = "#94fe00ff"
```

亮色和暗色的变量一一对应，切换时自动应用对应颜色。

## 完整颜色变量

| 变量 | 作用 | 亮色示例 | 暗色示例 |
|------|------|---------|---------|
| `vp-c-bg` | 页面背景色 | `#fafafa` | `#202127` |
| `vp-c-brand` | 品牌主色 | `#4259f3` | `#94fe00` |
| `vp-c-brand-1` | 辅助品牌色 | `#42a903` | `#fb9300` |
| `vp-c-text-1` | 主文字色 | `#222` | `#ccc` |
| `vp-button-brand-bg` | 按钮背景 | `#129083` | `#f2b983` |
| `c-text-code` | 行内代码色 | `#305fef` | `#00ff00` |
| `c-text-strong` | 粗体文字色 | `#f00` | `#ff0000` |
| `c-text-em` | 斜体文字色 | `#00f` | `#00ffff` |
| `vp-sidebar-bg-color` | 侧边栏背景 | `#f3f3f3` | `#181922` |

## 颜色值格式

支持所有 CSS 颜色格式：

```toml
# 十六进制
vp-c-brand = "#4259f3"

# 带透明度的十六进制
vp-c-brand = "#94fe00ff"

# rgb / rgba
vp-c-text-1 = "rgb(34, 34, 34)"

# CSS 变量引用
vp-c-bg = "var(--vp-c-bg)"
```

## 切换行为

用户可以通过以下方式切换亮/暗模式：

1. 导航栏的亮/暗切换按钮
2. 浏览器/系统级的 prefers-color-scheme 媒体查询
3. VitePress 内置的 `useData().isDark` API

## theme-color Meta 标签

```toml
[meta]
theme-color = "#4259f3"
```

这个值影响移动端浏览器的地址栏和状态栏颜色（仅亮色模式）。

## 设计建议

1. 保证亮/暗模式的对比度都符合 WCAG AA 标准（4.5:1）
2. 代码块在暗色模式下使用暗色调背景
3. 图片在暗色模式下可能需要不同的版本（或使用 SVG）

## 相关文档

- [[../../customizing-theme|定制主题]]
- [[../color-scheme-config|颜色方案]]
- [[../typography-and-fonts|排版字体]]
