---
date: 2026-01-22
title: Theme 核心包
tags:
  - Theme
  - 主题
  - 组件
  - 样式系统
description: vitepress-clear-blog 主题包架构详解
---

# Theme 核心包

> vitepress-clear-blog 主题包架构详解

## 目录结构

```
packages/theme/
├── src/
│   ├── components/      # Vue 组件
│   │   ├── Blog/        # 博客相关组件
│   │   ├── Graph/       # 图谱视图组件
│   │   └── Layout/      # 布局组件
│   ├── composables/     # Vue Composables
│   ├── styles/          # SCSS 样式
│   ├── node/            # Node.js 端代码
│   ├── types/           # TypeScript 类型
│   └── index.ts         # 主入口
├── lib/                 # 构建输出
├── uno.config.ts        # UnoCSS 配置
└── package.json
```

## 导出结构

### 主入口

```typescript
// 客户端导出
export { default as Theme } from './theme'
export * from './components'
export * from './composables'
```

### Node 入口

```typescript
// node/index.ts - 构建时使用
export { getThemeConfig } from './config'
export { mermaidPlugin } from './plugins'
```

## 核心组件

| 组件 | 功能 |
| ---- | ---- |
| `Homepage` | 首页布局 |
| `BlogList` | 文章列表 |
| `BlogCard` | 文章卡片 |
| `GraphView` | 图谱视图 |
| `Timeline` | 时间线 |
| `TagCloud` | 标签云 |

## 样式系统

### SCSS 模块

```scss
// styles/index.scss
@use 'variables';
@use 'base';
@use 'components';
@use 'utilities';
```

### CSS 变量

```scss
:root {
  --clear-primary: #1934e9;
  --clear-bg: #ffffff;
  --clear-text: #333333;
}

.dark {
  --clear-bg: #1a1a1a;
  --clear-text: #eeeeee;
}
```

## 相关链接

- [[plugins|插件体系]]
- [[../features/index|功能特性]]

---

