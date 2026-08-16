---
page_id: "blog-system"
date: 2026-01-21
title: 博客系统
tags:
  - 博客
  - 文章列表
  - 标签
  - 时间线
description: 文章列表、卡片视图与分类系统
---

# 博客系统

> 文章列表、卡片视图与分类系统

## 文章列表

### 列表视图

```vue
<BlogList :posts="posts" view="list" />
```

展示信息：
- 📝 文章标题
- 📅 发布日期
- 🏷️ 标签列表
- 📖 摘要预览

### 卡片视图

```vue
<BlogList :posts="posts" view="card" />
```

特点：
- 🖼️ 封面图展示
- 🎨 美观的卡片布局
- 📱 响应式设计

## 标签系统

### 标签页面

```markdown
---
layout: tags
---
```

功能：
- 标签云展示
- 点击筛选
- 文章计数

### Frontmatter 配置

```yaml
---
title: 我的文章
date: 2026-01-01
tags:
  - VitePress
  - 博客
  - 教程
---
```

## 时间线

### 归档视图

按年月归档文章：

```
2024
├── 01 月 (5 篇)
│   ├── VitePress 入门
│   └── ...
└── 02 月 (3 篇)
    └── ...
```

## 相关链接

- [[search-and-nav|搜索与导航]]
- [[../monorepo/theme-package|Theme 核心包]]

---

