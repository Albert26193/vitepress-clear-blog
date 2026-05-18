---
title: Wiki Links 高级技巧
date: 2026-05-16
tags:
  - wikilinks
  - advanced
  - navigation
description: 相对路径、跨目录链接、中文文件名、特殊字符等 Wikilinks 高级用法
---

# Wiki Links 高级技巧

掌握基础语法后，本文介绍 Wikilinks 的高级用法和边界情况处理。

## 相对路径链接

使用 `../` 可以链接到上级目录的文档：

- 从 `wikilinks/` 链接到同组文档：[[../wikilinks-basic-guide|基础入门]]
- 链接到 basics 分组：[[../basics/text-formatting|文本格式化]]
- 链接到 extensions：[[../extensions/callout-types|Callout 类型]]
- 链接到已有博客：[[../../d3-force-graph|D3 力导向图]]

## 跨目录链接到 Collections

Wikilinks 可以跨越目录结构链接到 Collections：

- [[../../../collections/frontend/vue3-composition-api|Vue 3 Composition API]]
- [[../../../collections/operations/部署与运维实践|部署与运维实践]]
- [[../../../collections/operations/ci-cd-pipeline-setup|CI/CD 流水线]]

## 中文文件名链接

Wikilinks 完全支持中文文件名：

- [[../../../collections/operations/部署与运维实践]] — 直接使用中文文件名

中文文件名的 Wikilinks 与英文文件名行为完全一致，支持别名、相对路径等所有特性。

## 特殊字符处理

### 空格和标点

文件名中包含空格时，在 Wikilinks 中使用 `%20` 或直接使用空格（视具体渲染引擎支持而定）。

建议文件名使用 kebab-case：`my-document` 而非 `my document`。

### 别名中的特殊字符

`[[部署与运维实践|部署 & 运维 实践指南]]` 在别名中可以使用 `&`、数字等字符。

## Broken Link 检测

链接到不存在的文档时，会渲染为红色样式：

[[this-page-does-not-exist-anywhere]]

这是一个不存在的页面链接，用于演示 broken link 的视觉反馈。

## resolutionModes 配置

在 `config.toml` 中：

```toml
[links]
resolutionModes = ["repoRoot", "absolutePath", "relativeToCurrentFile", "obsidianShortest"]
```

四种解析模式按优先级排列：

1. **repoRoot** — 从仓库根目录解析
2. **absolutePath** — 绝对路径解析
3. **relativeToCurrentFile** — 相对于当前文件的路径
4. **obsidianShortest** — Obsidian 最短路径匹配

## 相关文档

- [[../wikilinks-basic-guide|Wikilinks 基础]]
- [[../edge-cases/very/deep/nested/path/wikilinks-boundary-test|边界测试]]
- [[../../d3-force-graph|D3 力导向图]]
- [[../../../collections/frontend/react-vs-vue-comparison|React vs Vue]]
