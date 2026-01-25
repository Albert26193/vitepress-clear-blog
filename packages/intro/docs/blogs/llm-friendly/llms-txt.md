---
date: 2026-01-25
title: llms.txt 规范
tags:
  - LLM
  - AI
  - llms.txt
  - 项目介绍
description: 通过 llms.txt 为大语言模型提供项目上下文
---

# llms.txt 规范

> 📄 为 LLM 提供结构化的项目上下文信息

## 什么是 llms.txt

`llms.txt` 是一种新兴的标准，用于向大语言模型提供项目的关键信息，帮助 AI 更好地理解项目结构和约定。

## 本项目的集成方式

本项目通过 [vitepress-plugin-llms](https://github.com/okikio/vitepress-plugin-llms) 插件实现 llms.txt 的自动生成。

### 安装依赖

```bash
pnpm add vitepress-plugin-llms
```

### 配置插件

在 `packages/theme/src/utils/node/configProvider.ts` 中集成：

```typescript
import llmstxt from 'vitepress-plugin-llms'

const getThemeConfig = async (cfg = {}): Promise<any> => {
  return {
    // ... other config
    vite: {
      plugins: [
        llmstxt(),  // 启用 llms.txt 生成
        // ... other plugins
      ]
    }
  }
}
```

### 自动生成

构建时，插件会自动：

1. **扫描所有 Markdown 文件** - 收集文档内容
2. **生成 llms.txt** - 输出到 `.vitepress/dist/llms.txt`
3. **生成 llms-full.txt** - 包含完整文档内容的版本

### 生成文件位置

```
.vitepress/dist/
├── llms.txt           # 精简版，包含文档结构和摘要
└── llms-full.txt      # 完整版，包含所有文档内容
```

## llms.txt 内容结构

生成的 `llms.txt` 包含以下信息：

```markdown
# Project: vitepress-clear-blog

## Overview
A VitePress-based blog theme with Obsidian-style features.

## Tech Stack
- Vue 3 + TypeScript
- VitePress
- pnpm Monorepo

## Directory Structure
- packages/theme - Main theme package
- packages/docs - Documentation site
- packages/vitepress-plugin-* - Plugins

## Conventions
- Use TypeScript for all source code
- Follow ESLint + Prettier rules
- Commit messages follow Conventional Commits
```

## 使用场景

### 1. AI 编程助手

```bash
# 在 Cursor/Windsurf 等 AI 编辑器中
# 自动读取 llms.txt 作为项目上下文
```

### 2. ChatGPT/Claude 对话

```
请参考以下项目信息：
[粘贴 llms.txt 内容]

帮我实现一个新功能...
```

### 3. API 集成

```typescript
// 获取项目的 llms.txt
const response = await fetch('https://your-site.com/llms.txt')
const context = await response.text()

// 作为 LLM 的系统提示词
const messages = [
  { role: 'system', content: `项目上下文：\n${context}` },
  { role: 'user', content: userQuestion }
]
```

## 最佳实践

### 1. 保持文档质量

- 确保 Markdown 文件有清晰的标题和描述
- 使用 frontmatter 提供元数据
- 保持目录结构清晰

### 2. 定期构建

```bash
# 每次发布前重新构建，更新 llms.txt
pnpm build
```

### 3. 版本控制

考虑将生成的 `llms.txt` 提交到仓库，方便直接引用。

## 与其他工具配合

| 工具 | 集成方式 |
| ---- | -------- |
| **Cursor** | 自动读取项目根目录的 llms.txt |
| **Windsurf** | 支持 llms.txt 作为项目上下文 |
| **GitHub Copilot** | 可手动提供作为参考 |
| **ChatGPT/Claude** | 作为对话的背景信息 |

## 相关链接

- [[footnote-enhance|脚注增强]]
- [[index|LLM 友好支持概览]]
- [vitepress-plugin-llms 文档](https://github.com/okikio/vitepress-plugin-llms)

---
