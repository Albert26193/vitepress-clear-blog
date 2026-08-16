---
page_id: "tables-lists-images"
title: 表格、列表与图片嵌入
date: 2026-05-08
tags:
  - markdown
  - tables
  - lists
  - images
description: 复杂表格、多级嵌套列表、任务清单与图片排版的完整演示
---

# 表格、列表与图片

Markdown 的排版能力不止于文本。本文展示表格、列表与图片的高级用法。

## 表格

### 对齐方式

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:-------:|-------:|
| 内容 1 | 内容 2 | 内容 3 |
| 长文本内容测试 | 居中 | 右对齐 |
| 左 | 中 | 右侧长文本内容 |

### 复杂表格

| Feature | Status | Priority | Owner |
|---------|--------|----------|-------|
| MathJax | Done | P0 | Core |
| Mermaid | Done | P0 | Plugin |
| Wikilinks | Done | P1 | Core |
| RSS | Planned | P2 | Plugin |

## 列表

### 无序列表

- 一级项目
  - 二级项目
    - 三级项目
      - 四级项目

### 有序列表

1. 第一步：安装依赖
2. 第二步：配置文件
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步：启动服务

### 混合嵌套

1. 准备工作
   - 安装 Node.js
   - 配置 pnpm
2. 开发阶段
   - 编写代码
     1. 组件开发
     2. 路由配置
   - 运行测试

## 任务清单

- [x] 完成组件开发
- [x] 编写单元测试
- [ ] 集成测试
- [ ] 上线部署
- [ ] 性能优化

任务列表中的 Markdown 格式依然有效：**重点任务**、~~已取消的任务~~。

## 图片

### 基础图片

![VitePress Logo](https://vitepress.dev/vitepress-logo-large.webp)

### HTML img 标签

<img src="https://vitepress.dev/vitepress-logo-large.webp" alt="alt text" width="200" />

HTML 方式支持更灵活的大小和样式控制。

## 相关文档

- [[../text-formatting|文本格式化]]
- [[../extensions/mathjax-showcase|MathJax 展示]]
- [[../../collections/frontend/vue3-composition-api|Vue 3 API]]
