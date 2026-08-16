---
page_id: "vitepress"
date: 2026-01-24
title: VitePress 框架
tags:
  - VitePress
  - 技术选型
  - SSG
description: 为什么选择 VitePress 作为项目基础框架
---

# VitePress 框架

> 为什么选择 VitePress 作为项目基础框架

## 选型理由

### 1. Vue 3 原生支持

VitePress 基于 Vue 3 构建，完美支持：
- Composition API
- `<script setup>` 语法糖
- TypeScript 深度集成

### 2. Vite 驱动

- ⚡ 极速冷启动
- 🔥 热模块替换 (HMR)
- 📦 优化的生产构建

### 3. Markdown 增强

```md
- 内置 frontmatter 解析
- 代码块语法高亮
- 自定义容器扩展
- Vue 组件直接使用
```

### 4. 对比其他方案

| 特性 | VitePress | VuePress | Docusaurus |
| ---- | ---- | ---- | ---- |
| 框架 | Vue 3 | Vue 2/3 | React |
| 构建 | Vite | Webpack | Webpack |
| 性能 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| 学习曲线 | 低 | 中 | 中 |

## 核心配置

```typescript
// .vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Blog',
  themeConfig: {
    // 主题配置
  }
})
```

## 相关链接

- [[vue3-ecosystem|Vue3 生态]] - 了解 Vue 3 相关技术栈
- [[../monorepo/theme-package|Theme 核心包]] - 主题包如何扩展 VitePress

---

