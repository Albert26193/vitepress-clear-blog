---
page_id: "wikilinks-basic-guide"
title: Wiki Links 基础入门
date: 2026-05-15
tags:
  - wikilinks
  - navigation
  - links
description: 基础 Wikilinks 语法：[[target]]、[[target|别名]]、与标准 Markdown 链接的区别
---

# Wiki Links 基础入门

Wikilinks 是 Obsidian 风格的内部链接语法。VitePress Theme Link 内置了 Wikilinks 支持，让文档间交叉引用更自然。

## 启用 Wikilinks

在 `config.toml` 中：

```toml
[markdown]
wikilinks = true
```

## 基础语法

### 简单链接

`[[getting-started]]` 会渲染为指向 [[getting-started|入门教程]] 的链接。

### 带别名

`[[getting-started|入门教程]]` 使用 `|` 分隔符指定显示文本。

### 链接到任意文档

只需使用目标文档的文件名（不含 `.md` 扩展名）：

- [[../basics/text-formatting|文本格式化]]
- [[../extensions/mermaid-diagrams-comprehensive|Mermaid 图表]]
- [[../../d3-force-graph|D3 力导向图]]

## 与 Markdown 链接的区别

| 特性 | Wikilinks `[[...]]` | Markdown `[...](...)` |
|------|---------------------|-----------------------|
| 语法 | `[[目标]]` | `[文本](路径.md)` |
| 路径解析 | 自动查找匹配文档 | 需要精确路径 |
| 别名 | `[[目标\|别名]]` | `[别名](路径)` |
| 不存在的链接 | 红色 broken link | 404 不提示 |

## link_style = "wiki"

在 `config.toml` 中配置：

```toml
[markdown]
link_style = "wiki"
```

这个设置会让所有标准 Markdown 内部链接也渲染为 Wikilinks 样式，保持链接外观统一。

## 链接到各组文档

- Markdown 基础：[[../basics/text-formatting|文本格式化]] | [[../basics/code-and-syntax-highlight|代码高亮]] | [[../basics/tables-lists-images|表格列表图片]]
- Markdown 扩展：[[../extensions/mathjax-showcase|MathJax]] | [[../extensions/callout-types|Callout]] | [[../extensions/footnote-system|脚注]]
- 导航结构：[[../navigation/nav-bar-configuration|导航栏]] | [[../navigation/sidebar-and-outline|侧边栏]]
- 主题功能：[[../theme/dark-mode-customization|暗色模式]] | [[../theme/color-scheme-config|颜色方案]]
- 已有文档：[[../../getting-started|入门教程]] | [[../../markdown-features|功能总览]]

## 相关文档

- [[../wikilinks-advanced-techniques|Wikilinks 高级]]
- [[../edge-cases/very/deep/nested/path/wikilinks-boundary-test|边界测试]]
- [[../../getting-started|入门教程]]
