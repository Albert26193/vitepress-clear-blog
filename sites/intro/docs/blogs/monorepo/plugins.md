---
page_id: "plugins"
date: 2026-01-22
title: 插件体系
tags:
  - 插件
  - markdown-it
  - Vite Plugin
  - 开发指南
description: VitePress 插件设计模式与开发指南
---

# 插件体系

> VitePress 插件设计模式与开发指南

## 插件架构

### Node/Client 分离

```
vitepress-plugin-xxx/
├── src/
│   ├── index.ts         # Node 入口（构建时）
│   ├── client.ts        # Client 入口（运行时）
│   └── types.ts         # 类型定义
├── lib/                 # 构建输出
└── package.json
```

### 导出配置

```json
{
  "exports": {
    ".": {
      "types": "./lib/index.d.ts",
      "import": "./lib/index.js"
    },
    "./client": {
      "types": "./lib/client.d.ts",
      "import": "./lib/client.js"
    }
  }
}
```

## 插件类型

### markdown-it 插件

扩展 Markdown 解析：

```typescript
// Callout 插件示例
export function calloutPlugin(md: MarkdownIt) {
  md.use((md) => {
    // 扩展 blockquote 解析
    const defaultRender = md.renderer.rules.blockquote_open
    md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
      // 自定义渲染逻辑
    }
  })
}
```

### Vite 插件

构建时处理：

```typescript
// Mermaid 插件示例
export function mermaidPlugin(): Plugin {
  return {
    name: 'vitepress-plugin-mermaid',
    transform(code, id) {
      if (id.endsWith('.md')) {
        // 转换 Mermaid 代码块
      }
    }
  }
}
```

## 现有插件

| 插件 | 类型 | 功能 |
| ---- | ---- | ---- |
| `callout` | markdown-it | Obsidian 风格提示框 |
| `codeblock-fold` | markdown-it | 代码块折叠 |
| `details-block` | markdown-it | 折叠详情块 |
| `hashtag` | markdown-it | `#TagName` 语法自动转换为可点击标签链接，指向 `/tags?tag=` 筛选页面 |
| `analyzer` | vite | 内容分析 |
| `config` | utility | 配置工具 |

## 开发新插件

### 1. 创建目录

```bash
mkdir packages/vitepress-plugin-my-feature
cd packages/vitepress-plugin-my-feature
```

### 2. 初始化 package.json

```json
{
  "name": "vitepress-plugin-my-feature",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./lib/index.js"
  },
  "peerDependencies": {
    "vitepress": "^1.5.0"
  }
}
```

### 3. 编写插件代码

```typescript
// src/index.ts
import type { Plugin } from 'vite'

export interface MyFeatureOptions {
  enabled?: boolean
}

export function myFeaturePlugin(options?: MyFeatureOptions): Plugin {
  return {
    name: 'vitepress-plugin-my-feature',
    // 实现逻辑
  }
}
```

## 相关链接

- [[theme-package|Theme 核心包]]
- [[../features/markdown-enhance|Markdown 增强功能]]

---

