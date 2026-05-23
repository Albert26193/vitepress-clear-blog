---
date: 2026-01-25
title: Monorepo 架构 - MOC
tags:
  - MOC
  - Monorepo
  - pnpm
  - 架构设计
description: 项目 Monorepo 架构设计，基于 pnpm workspace 的模块化设计
---

# 📦 Monorepo 架构设计

> 本章节介绍项目的 Monorepo 架构设计

## 概览

项目采用 pnpm workspace 实现 Monorepo 架构：

```
vitepress-theme-link/
├── packages/
│   ├── docs/                          # 文档站点（博客）
│   ├── intro/                         # 项目介绍文档
│   ├── theme/                         # 核心主题包
│   ├── vitepress-plugin-analyzer/     # 分析器插件
│   ├── vitepress-plugin-callouts/      # Callout 插件
│   ├── vitepress-plugin-codeblock-fold/ # 代码折叠插件
│   ├── vitepress-plugin-config/       # 配置工具插件
│   ├── vitepress-plugin-details-block/ # Details 块插件
│   └── vitepress-plugin-hashtag/      # Hashtag 插件
├── package.json
└── pnpm-workspace.yaml
```

## 架构优势

| 优势 | 说明 |
| ---- | ---- |
| 代码共享 | 类型、工具函数共享 |
| 原子提交 | 多包更新单次提交 |
| 依赖管理 | 统一版本控制 |
| 开发体验 | 单仓库开发所有包 |

## 文档列表

### [[workspace|pnpm Workspace]]
- 工作区配置
- workspace 协议
- 依赖提升策略

### [[packages-overview|包职责划分]]
- 各包功能定位
- 依赖关系图
- 版本管理

### [[theme-package|Theme 核心包]]
- 主题架构设计
- 组件体系
- 样式系统

### [[plugins|插件体系]]
- 插件设计模式
- Node/Client 分离
- 开发新插件指南


