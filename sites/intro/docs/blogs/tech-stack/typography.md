---
page_id: "typography"
date: 2026-01-24
title: 排版优化
tags:
  - Heti
  - 排版
  - 中文排版
  - 阅读体验
description: 中文排版与阅读体验优化方案
---

# 排版优化

> 中文排版与阅读体验优化方案

## Heti 中文排版

### 简介

Heti（赫蹏）是专为中文内容设计的排版增强工具，解决：

- 中英文混排间距
- 标点挤压
- 行高优化

### 集成方式

```typescript
// 在主题中引入 Heti 样式
import 'heti/umd/heti.min.css'
```

### 效果对比

| 项目       | 优化前      | 优化后       |
| ---------- | ----------- | ------------ |
| 中英文间距 | `Hello世界` | `Hello 世界` |
| 标点位置   | 压缩        | 正常         |
| 行高       | 1.5         | 1.75         |

## 代码高亮

### Shiki 配置

```toml
# .vitepress/config.toml
[markdown.theme]
light = "github-light"
dark = "ayu-dark"
```

### 支持特性

- ✅ 语法高亮
- ✅ 行号显示
- ✅ 行高亮
- ✅ 代码组
- ✅ 代码折叠（通过插件）

## 阅读体验

### 字体栈

```css
:root {
  --vp-font-family-base: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --vp-font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 响应式设计

- 📱 移动端适配
- 💻 桌面端优化
- 🖥️ 大屏幕支持

## 相关链接

- [[index|技术选型 MOC]]
- [[../features/markdown-enhance|Markdown 增强功能]]

---
