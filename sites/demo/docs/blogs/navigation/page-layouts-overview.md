---
title: 页面布局类型总览
date: 2026-05-20
tags:
  - layout
  - page
  - home
description: home、page、blog post 三种页面布局的区别与使用场景
---

# 页面布局类型总览

VitePress Theme Link 支持三种页面布局类型，通过 frontmatter 控制。

## 1. 首页布局（home）

首页使用 `Homepage` 组件渲染，通常不需要在 frontmatter 中显式声明，通过 `docs/index.md` 作为站点入口。

config.toml 中的 `[homepage]` 区块控制首页内容：

```toml
[homepage]
title = "My Blog"
description = "A personal blog powered by VitePress Theme Link"
```

首页适合展示站点概览、D3 知识图谱、导航入口。

## 2. 自定义页面布局（page）

使用 `page: true` 将 `.md` 文件标记为自定义页面：

```yaml
---
page: true
title: Tags
aside: false
sidebar: false
---
```

自定义页面通常配合内置组件使用：

```md
<!-- 标签页 -->
<Tags />

<!-- 时间线页 -->
<Timeline />

<!-- 文章列表 -->
<BlogMain />

<!-- Collections -->
<Collections />
```

当前 Demo 中的自定义页面：

| 页面 | 组件 | 路径 |
|------|------|------|
| Tags | `<Tags />` | `/tags.html` |
| Timeline | `<Timeline />` | `/timeline.html` |
| Pages | `<BlogMain />` | `/pages/` |
| Collections | `<Collections />` | `/collections/` |

## 3. 博客文章布局（默认）

没有 `layout` 或 `page` frontmatter 的 `.md` 文件即为博客文章：

```yaml
---
title: My Post
date: 2026-01-01
tags:
  - demo
---
```

博客文章显示完整的文章页面，包含标题、日期、标签、作者信息（DocBanner）、正文内容和脚注。

## 布局组件对照

| 布局类型 | 主要组件 | 侧边栏 | aside | footer |
|---------|---------|--------|-------|--------|
| Homepage | Homepage + D3 | 无 | 无 | 无 |
| Page | 自定义组件 | 可配 | 可配 | 有 |
| Blog Post | DocBanner + Content | 有 | 有 | 有 |

## 相关文档

- [[../nav-bar-configuration|导航栏配置]]
- [[../../d3-force-graph|D3 力导向图]]
- [[../../markdown-features|功能总览]]
