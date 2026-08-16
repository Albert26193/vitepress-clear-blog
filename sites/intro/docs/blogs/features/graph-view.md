---
page_id: "graph-view"
date: 2026-01-21
title: 图谱视图
tags:
  - 图谱视图
  - D3.js
  - 双链
  - 可视化
description: D3.js 实现的双链关系可视化
---

# 图谱视图

> D3.js 实现的双链关系可视化

## 功能介绍

图谱视图（Graph View）是项目的核心特性之一，灵感来源于 Obsidian：

- 🔗 展示文档间的双链关系
- 🖱️ 支持拖拽、缩放交互
- 🎨 美观的力导向布局
- 🌙 支持深色模式

## 技术实现

### D3.js 力导向图

```typescript
import * as d3 from 'd3'

const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links)
    .id((d: any) => d.id)
    .distance(100))
  .force('charge', d3.forceManyBody()
    .strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(30))
```

### 数据结构

```typescript
interface GraphNode {
  id: string
  title: string
  path: string
  links: string[]  // 出链
  backlinks: string[]  // 反向链接
}

interface GraphLink {
  source: string
  target: string
}
```

## 交互功能

| 交互 | 效果 |
| ---- | ---- |
| 悬停节点 | 高亮关联节点 |
| 点击节点 | 跳转到对应文档 |
| 拖拽节点 | 调整位置 |
| 滚轮 | 缩放视图 |

## 使用方式

### 全局图谱

访问 `/graph` 页面查看全局文档关系图。

### 局部图谱

每篇文档可展示相关的局部图谱：

```vue
<LocalGraph :currentPage="page.relativePath" />
```

## 相关链接

- [[../tech-stack/visualization|可视化方案]]
- [[markdown-enhance|Markdown 增强]] - WikiLink 语法

---

