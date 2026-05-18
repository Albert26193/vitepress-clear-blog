---
title: 排版与字体设置
date: 2026-05-23
tags:
  - typography
  - fonts
  - theme
description: 中英文混排、字体族、间距、行高和 heti 排版增强详解
---

# 排版与字体设置

良好的排版是博客可读性的基础。VitePress Clear Blog 使用 Inter 英文字体、中文系统字体栈，并集成 heti 进行中西文混排增强。

## 字体系统

### 英文字体

默认使用 **Inter** 字体族，通过 Google Fonts 加载：

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 中文字体

依赖操作系统中文字体：

```css
font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 
             'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
```

### 等宽字体（代码）

```css
font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 
             'Source Code Pro', 'Menlo', 'Consolas', monospace;
```

## heti 排版增强

Heti（赫蹏）是一个中西文混排美化库，自动处理：

- **中西文间距**：自动在 CJK 字符和 Latin 字符之间插入 1/4 em 间距
- **标点挤压**：中文标点自动调整间距
- **文本对齐**：两端对齐优化

在模板中使用 `heti` class 启用：

```html
<div class="heti heti--serif">
  本文内容 ...
</div>
```

`heti--serif` 使用衬线字体，`heti--classic` 提供另一种风格。

## 响应式字号

VitePress Clear Blog 使用响应式字号系统：

| 断点 | 正文字号 | 标题字号 (h1) |
|------|---------|--------------|
| 默认 (<768px) | 14px | 22px |
| md (≥768px) | 16px | 28px |
| lg (≥1024px) | 17px | 32px |

## 字体加载策略

- 使用 `font-display: swap` 避免 FOIT
- 预加载关键字体文件
- 中文字体按需子集化（如有需要）

## 相关文档

- [[../../basics/text-formatting|文本格式化]]
- [[../color-scheme-config|颜色方案]]
- [[../dark-mode-customization|暗色模式]]
