---
title: 项目文档导航 (MOC)
date: 2026-01-25
description: vitepress-theme-link 项目架构、技术选型、工程规范与功能介绍文档导航中心
tags:
  - MOC
  - 项目介绍
  - 文档导航
---

# vitepress-theme-link 项目文档

> 🎯 这是项目的 **MOC (Map of Content)** - 导航中心

本项目是一个基于 VitePress 的博客主题，提供 Obsidian 风格的双链笔记体验。

## 项目亮点

- 📦 **Monorepo 架构** - 基于 pnpm workspace 的模块化设计
- 🔗 **双链笔记** - 支持 WikiLink、Graph View 等 Obsidian 风格功能
- 🎨 **美观易用** - 清爽的博客主题，优秀的阅读体验
- 🛠️ **工程化完善** - 完整的 ESLint、Prettier、Husky 工具链

## 文档导航

### [[./tech-stack/index|🛠️ 技术选型]]

了解项目的技术栈选择与设计考量：
- [[./tech-stack/vitepress|VitePress 框架]] - 为什么选择 VitePress
- [[./tech-stack/vue3-ecosystem|Vue3 生态]] - VueUse、UnoCSS 等
- [[./tech-stack/visualization|可视化方案]] - D3.js、Mermaid
- [[./tech-stack/typography|排版优化]] - Heti、中文排版

### [[./engineering/index|🏗️ 工程规范化基座]]

完善的工程化配置体系：
- [[./engineering/eslint-prettier|ESLint & Prettier]] - 代码规范
- [[./engineering/typescript|TypeScript 配置]] - 类型系统
- [[./engineering/commit-lint|Git 提交规范]] - Husky + Commitlint
- [[./engineering/build-toolchain|构建工具链]] - tsup、Vite

### [[./monorepo/index|📦 Monorepo 架构设计]]

深入理解项目架构：
- [[./monorepo/workspace|pnpm Workspace]] - 工作区设计
- [[./monorepo/packages-overview|包职责划分]] - 7+ 子包概览
- [[./monorepo/theme-package|Theme 核心包]] - 主题包详解
- [[./monorepo/plugins|插件体系]] - 插件设计模式

### [[./features/index|✨ 功能可用性]]

丰富的功能特性：
- [[./features/feature-overview|📋 功能概览]] - 130+ 功能完整清单
- [[./features/blog-system|博客系统]] - 文章列表、卡片视图
- [[./features/graph-view|图谱视图]] - D3 力导向图
- [[./features/markdown-enhance|Markdown 增强]] - WikiLink、Callout、Mermaid
- [[./features/search-and-nav|搜索与导航]] - 本地搜索、时间线

### [[./llm-friendly/index|🤖 LLM 友好支持]]

为 AI 辅助开发提供最佳体验：
- [[./llm-friendly/llms-txt|llms.txt 规范]] - 项目级 LLM 上下文文件
- [[./llm-friendly/footnote-enhance|脚注增强]] - 脚注增强功能说明与使用指南

### [[./roadmap/index|🗺️ 路线图]]

项目发展规划：
- [[./roadmap/done|已完成]] - 历史版本功能
- [[./roadmap/in-progress|进行中]] - 当前开发重点
- [[./roadmap/planned|计划中]] - 未来功能规划

---

## 快速链接

- 📖 [GitHub 仓库](https://github.com/Albert26193/vitepress-theme-link)
- 🎨 [在线演示 (docs)](../docs/)
