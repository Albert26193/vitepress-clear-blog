---
title: Wiki Links 边界情况测试
date: 2026-05-17
tags:
  - wikilinks
  - edge-cases
  - testing
description: 极深路径、多级相对路径、中文文件名等 Wikilinks 边界情况测试
---

# Wiki Links 边界情况测试

本文位于极深路径下（`blogs/wikilinks/edge-cases/very/deep/nested/path/`），用于测试 Wikilinks 在各种边界情况下的解析能力。

## 极长相对路径

使用 13 级 `../` 链接回项目各处的文档：

### 链接回 wikilinks 组的文档

- [[../../../../../../../../../../../../../blogs/wikilinks/wikilinks-basic-guide|基础入门]]
- [[../../../../../../../../../../../../../blogs/wikilinks/wikilinks-advanced-techniques|高级技巧]]

### 链接回 basics 组

- [[../../../../../../../../../../../../../blogs/basics/text-formatting|文本格式化]]
- [[../../../../../../../../../../../../../blogs/basics/code-and-syntax-highlight|代码与语法高亮]]

### 链接回 extensions 组

- [[../../../../../../../../../../../../../blogs/extensions/mermaid-diagrams-comprehensive|Mermaid 图表大全]]
- [[../../../../../../../../../../../../../blogs/extensions/mathjax-showcase|MathJax 展示]]

### 跨组链接到已有的博客

- [[../../../../../../../../../../../../../blogs/getting-started|入门教程]]
- [[../../../../../../../../../../../../../blogs/d3-force-graph|D3 力导向图]]
- [[../../../../../../../../../../../../../blogs/rss-feed-test|RSS 测试]]

### 链接到 Collections 中文文件名

- [[../../../../../../../../../../../../../collections/operations/部署与运维实践]]
- [[../../../../../../../../../../../../../collections/frontend/vue3-composition-api|Vue 3 API]]

### 链接到 navigation 和 theme

- [[../../../../../../../../../../../../../blogs/navigation/nav-bar-configuration|导航栏配置]]
- [[../../../../../../../../../../../../../blogs/theme/dark-mode-customization|暗色模式]]

## 混合相对路径和绝对路径

从最深路径出发：

- 同组文档：`[[../wikilinks-basic-guide]]` 语法更短
- 跨大组：多级 `../../` 仍然有效
- 中文文件名：`[[../../../../../../../../../../../../../collections/operations/部署与运维实践]]`

## 不存在的链接测试

[[this-file-definitely-does-not-exist]] — 从深路径测试 broken link

## 结论

极深目录下，多级 `../` 相对路径可以正确解析到浅层文档，中文文件名 Wikilinks 工作正常。

相关文档：

- [[../../../../../../../../../../../../../blogs/wikilinks/wikilinks-basic-guide|基础入门]]
- [[../../../../../../../../../../../../../blogs/getting-started|入门教程]]
