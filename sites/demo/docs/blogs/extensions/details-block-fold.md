---
page_id: "details-block-fold"
title: 可折叠详情块 DetailsBlock
date: 2026-05-14
tags:
  - details-block
  - fold
  - extension
description: 使用 DetailsBlock 组件实现内容折叠与渐进式信息披露
---

# 可折叠详情块 DetailsBlock

DetailsBlock 是 VitePress Theme Link 内置的折叠组件，用于渐进式信息披露。

## 基础用法

使用 `::: details` 语法：

::: details 点击展开查看更多
这里是折叠内容。默认处于折叠状态，点击标题展开。

内部支持完整的 Markdown 渲染：

- 列表
- **粗体**
- `代码`
:::

## 嵌套折叠

::: details 外层折叠
外层内容，可包含嵌套折叠：

::: details 内层折叠
第二层折叠内容。DetailsBlock 支持任意层级的嵌套。
:::

回到外层内容。
:::

## 默认展开

`::: details open` 语法使折叠块默认处于展开状态：

::: details open 默认展开的内容
这个块默认展开，用户仍可手动折叠。适合展示：

1. 首次访问必读的重要信息
2. 默认显示但允许收起的长内容
3. 代码示例
:::

## FAQ 场景

::: details 如何启用 MathJax？
在 `config.toml` 的 `[markdown]` 区块中设置：

```toml
mathjax = true
```
:::

::: details 代码块如何折叠？
使用 `vitepress-plugin-codeblock-fold` 插件，长代码块会自动显示展开/折叠按钮。
:::

::: details 暗色模式如何切换？
VitePress 默认支持暗色模式切换，可通过 `config.toml` 的 `[theme.dark]` 区块自定义暗色主题颜色。
:::

## 使用建议

| 场景 | 推荐 |
|------|------|
| FAQ 问答 | `::: details` |
| 长代码块 | codeblock-fold 插件 |
| 重要提示 | Callout（不折叠） |
| 可选的补充材料 | `::: details` |
| 归档/历史记录 | `::: details open` |

## 相关文档

- [[../callout-types|Callout 类型]]
- [[../footnote-system|脚注系统]]
- [[../../../collections/operations/ci-cd-pipeline-setup|CI/CD 流水线]]
