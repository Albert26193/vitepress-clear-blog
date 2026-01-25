---
date: 2026-01-21
title: 搜索与导航
tags:
  - 搜索
  - 导航
  - 时间线
  - 标签云
description: 本地搜索、时间线与标签云
---

# 搜索与导航

> 本地搜索、时间线与标签云

## 本地搜索

### VitePress 内置搜索

```typescript
// .vitepress/config.ts
export default defineConfig({
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          }
        }
      }
    }
  }
})
```

### 搜索特性

- ⚡ 客户端本地搜索
- 🔍 全文索引
- ⌨️ 快捷键支持 (Ctrl/Cmd + K)
- 🎯 结果高亮

## 时间线导航

### 访问方式

```
/timeline
```

### 展示内容

```
2024
│
├── 01-15  VitePress 博客搭建指南
├── 01-10  Monorepo 实践总结
└── 01-05  新年第一篇

2023
│
├── 12-28  年终总结
└── ...
```

## 标签云

### 访问方式

```
/tags
```

### 功能

- 📊 标签使用频率可视化
- 🏷️ 点击标签筛选文章
- 🎨 不同大小/颜色表示热度

## 导航组件

### Nav 配置

```typescript
export const nav = [
  { text: '首页', link: '/' },
  { text: 'Pages', link: '/pages/' },
  { text: 'Timeline', link: '/timeline' },
  { text: 'Tags', link: '/tags' }
]
```

### Sidebar 配置

```typescript
export const sidebar = {
  '/guide/': [
    {
      text: '指南',
      items: [
        { text: '快速开始', link: '/guide/getting-started' }
      ]
    }
  ]
}
```

## 相关链接

- [[blog-system|博客系统]]
- [[../tech-stack/vitepress|VitePress 框架]]

---

