---
title: Callout 提示块类型全览
date: 2026-05-12
tags:
  - callout
  - markdown
  - extension
description: NOTE、TIP、INFO、WARNING、DANGER、cite 六种 Callout 类型完整展示
---

# Callout 提示块类型全览

Callout 是 Obsidian 风格的提示块扩展，支持六种类型和折叠模式。

## NOTE

> [!NOTE]
> 这是一条普通备注，用于补充说明信息。
>
> 可以包含多段落和 **Markdown 格式**。

## TIP

> [!TIP]
> 高效写作的建议：使用 Frontmatter 管理元数据，用 Wikilinks 建立交叉引用，按语义分组组织文档。

## INFO

> [!INFO]
> VitePress Clear Blog 的 Callout 支持六个类型：
> 1. NOTE — 普通备注
> 2. TIP — 技巧建议
> 3. INFO — 信息说明
> 4. WARNING — 警告注意
> 5. DANGER — 危险/严重警告
> 6. cite — 引用来源

## WARNING

> [!WARNING]
> 修改 `config.toml` 中的 `[markdown]` 扩展开关后，需要重启开发服务器才能生效。

## DANGER

> [!DANGER]
> **切勿**在生产环境的 `config.toml` 中提交真实密钥或敏感信息。使用环境变量或 `.env` 文件管理机密。

## cite（引用）

> [!cite] Wikipedia — Markdown
> Markdown is a lightweight markup language for creating formatted text using a plain-text editor. John Gruber created Markdown in 2004.

## 折叠 Callout

> [!NOTE]-
> 点击展开查看详情 —— 这是一个可折叠的 Callout。
>
> 折叠 Callout 适合收纳长内容，让页面保持整洁。用户按需展开查看。

> [!TIP]-
> 默认折叠的 Callout 在 `[!TYPE]-` 后面加 `-` 号即可。

## Callout 内嵌套

> [!INFO]
> Callout 内部可以嵌套代码块：
>
> ```ts
> // config.toml [markdown] section
> callout = true
> ```
>
> 以及嵌套列表、表格等任意 Markdown 内容。

## 使用场景

| 类型 | 适用场景 |
|------|---------|
| NOTE | 补充说明、背景信息 |
| TIP | 最佳实践、效率技巧 |
| INFO | 知识性说明、功能介绍 |
| WARNING | 注意事项、兼容性问题 |
| DANGER | 安全警告、破坏性操作 |
| cite | 引用来源、参考文献 |

## 相关文档

- [[../footnote-system|脚注系统]]
- [[../hashtag-discovery|Hashtag 标签发现]]
- [[../../basics/text-formatting|文本格式化]]
