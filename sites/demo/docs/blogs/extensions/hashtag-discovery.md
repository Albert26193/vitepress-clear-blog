---
page_id: "hashtag-discovery"
title: Hashtag 标签发现机制
date: 2026-05-13
tags:
  - hashtag
  - discovery
  - tags
  - extension
description: 正文中 #标签 的自动发现、链接与标签系统集成详解
---

# Hashtag 标签发现机制

Hashtag 扩展会自动识别正文中的 `#标签` 语法并将其链接到博客标签系统。

## 基础用法

在文章正文中直接书写 `#标签名` 即可。例如：

本文讨论 #vue3 响应式编程，涉及 #frontend 开发的最佳实践，并引用了一些 #tutorial 资料。

这些标签会被自动识别并渲染为可点击的标签链接。

## 如何生效

在 `config.toml` 中启用：

```toml
[markdown]
hashtag = true
```

启用后，正文中所有 `#` 后跟字母/数字/中文的连续文本会被自动解析为标签。

## 与 Frontmatter Tags 的关系

文章首页的标签来自 Frontmatter：

```yaml
tags:
  - hashtag
  - discovery
  - tags
```

正文中的 #标签 和 Frontmatter 中的 tags 指向同一个标签系统，点击后都会跳转到 `/tags.html?tag=标签名`。

## 中文标签支持

中文标签同样被支持：#博客 #技术文章 #开发工具 #响应式编程

## 边界情况

以下情况不会被识别为标签：

- URL 中的 `#` 锚点：`https://example.com/page#section`
- 代码块内的 `#` 注释
- 已经转义的 `\#` 字符
- 单独出现的 `#` 符号

## 标签导航

点击任意标签可跳转到 `/tags` 页面，按标签筛选文章列表。也可以直接访问 `https://yoursite.com/tags.html?tag=vue3` 来分享标签筛选结果。

## 相关文档

- [[../callout-types|Callout 类型]]
- [[../../../collections/frontend/vue3-composition-api|Vue 3 API]]
