---
page_id: "rss-seo-and-sitemap"
title: RSS 订阅、SEO 与站点地图
date: 2026-05-24
tags:
  - rss
  - seo
  - sitemap
  - automation
description: RSS Feed 自动生成、SEO 元数据、Open Graph 标签与站点地图配置
---

# RSS 订阅、SEO 与站点地图

优秀的博客应该具备 RSS 订阅、SEO 优化和自动站点地图。本文覆盖这些主题的完整配置。

## RSS 订阅

VitePress Theme Link 自动生成 RSS Feed，输出到 `/feed.rss`。

访问地址：`https://your-site.com/feed.rss`

### 启用条件

`config.toml` 中配置了 `siteUrl` 和 `[meta]` 信息即可：

```toml
[meta]
title = "My Blog"
description = "A personal blog"
author = "Blogger"
siteUrl = "https://albert26193.github.io"
```

RSS Feed 包含所有博客文章，按发布时间排序，包含标题、链接、摘要和发布日期。

### 消费方式

用户可通过任意 RSS 阅读器订阅：

1. NetNewsWire（macOS/iOS）
2. Feedly（Web/iOS/Android）
3. Inoreader（Web）
4. Miniflux（自托管）

## SEO 元数据

### [meta] 区块配置

```toml
[meta]
title = "My Blog"
description = "A personal blog powered by VitePress Theme Link"
author = "Blogger"
keywords = "blog, vitepress, static-site"
locale = "zh_CN"
lang = "zh-CN"
siteUrl = "https://albert26193.github.io"
```

这些字段映射到 HTML meta 标签：

```html
<meta name="description" content="A personal blog...">
<meta name="keywords" content="blog, vitepress, static-site">
<meta name="author" content="Blogger">
```

### Open Graph 标签

自动生成 OG 标签用于社交媒体分享预览：

```html
<meta property="og:title" content="My Blog">
<meta property="og:description" content="...">
<meta property="og:url" content="https://...">
<meta property="og:type" content="website">
```

### Frontmatter 级别的 SEO

每篇文章的 frontmatter `title` 和 `description` 会覆盖全局 meta，用于该页面的 title 标签和 meta description。

## 站点地图

VitePress 自动生成 sitemap.xml，包含所有页面和博客文章的 URL 及最后修改时间。

## llms.txt

VitePress Theme Link 的 llms 插件生成 `llms.txt` 和 `llms-full.txt`，供 LLM 工具索引站点内容。

- `llms.txt` — 目录索引（~1.5K tokens）
- `llms-full.txt` — 全文索引（~20K tokens）

## 相关文档

- [[../../rss-feed-test|RSS 测试]]
- [[../../deployment-guide|部署指南]]
- [[../dark-mode-customization|暗色模式]]
