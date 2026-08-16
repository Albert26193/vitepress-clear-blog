---
page_id: "wikilinks-boundary-test"
title: Wiki Links 边界情况测试
date: 2026-05-17
tags:
  - wikilinks
  - edge-cases
  - testing
description: 极深路径、多级相对路径、中文文件名等 Wikilinks 边界情况测试
---

# Wiki Links 边界情况测试

本文位于极深路径下（`blogs/wikilinks/edge-cases/very/deep/nested/path/`），用于验证 issue #434 中 wikilink 解析、broken 标记、站内跳转和标题渲染在边界情况下是否保持一致。

## A. Vault-Absolute（决策 1）

前置斜杠写法只在标准 Markdown 链接里保留；wikilink 层与 Obsidian 对齐，`[[/path]]` 一律视为 broken。

### A.1 多段路径

- [[/blogs/wikilinks/wikilinks-basic-guide]]
  - 期望：**broken**
  - 测试点：前置 `/` 的 wikilink 不再作为 vault-absolute 解析
  - 目标语法：前置斜杠 + 多段路径

### A.2 浅层路径

- [[/about]]
  - 期望：**broken**
  - 测试点：单段前置 `/` 写法同样被拒绝
  - 目标语法：前置斜杠 + 单段路径

### A.3 中文路径

- [[/collections/operations/部署与运维实践]]
  - 期望：**broken**
  - 测试点：中文文件名不会绕过前置斜杠限制
  - 目标语法：前置斜杠 + 中文路径段

## B. RelativeToCurrentFile（含 #434 主回归）

这些用例从当前深层目录出发，覆盖精准相对路径、少一级/多一级相对路径，以及过量 `../` 后的 basename fallback。

### B.1 精准返回到 `blogs/`

- [[../../../../../../wikilinks/wikilinks-basic-guide]]
  - 期望：**存在**
  - 测试点：从当前 7 层深目录正确回到 `blogs/wikilinks/wikilinks-basic-guide.md`
  - 目标语法：标准 `..` 链路 + 多段路径

### B.2 相对路径未直接命中，但 basename 唯一

- [[../../../../../wikilinks-basic-guide]]
  - 期望：**存在**
  - 测试点：显式相对路径允许继续回退到 `obsidianShortest`
  - 目标语法：`../` + 唯一 basename

### B.3 过量 `../` 后仍可解析唯一目标

- [[../../../../../../../../../../../../../blogs/wikilinks/wikilinks-basic-guide]]
  - 期望：**存在**
  - 测试点：过量 `../` 不应导致构建期/运行期结果分裂，可通过唯一 basename 回退命中
  - 目标语法：过量 `..` + 完整相对路径

- [[../../../../../../../../../../../../../blogs/getting-started]]
  - 期望：**存在**
  - 测试点：跨大组、过量 `../`、唯一 basename 组合仍保持稳定
  - 目标语法：过量 `..` + 跨组路径

### B.4 真正不存在的相对目标

- [[../../../../../this-truly-missing]]
  - 期望：**broken**
  - 测试点：直接路径与 `obsidianShortest` 都无法命中时保持 broken
  - 目标语法：相对路径 + 不存在 basename

## C. ObsidianShortest（basename 解析）

这些用例验证 shortest/basename 写法在真实内容树中的解析效果。

### C.1 唯一英文 basename

- [[wikilinks-advanced-techniques]]
  - 期望：**存在**
  - 测试点：basename 在 vault 中唯一时直接命中
  - 目标语法：纯 basename

### C.2 唯一中文 basename

- [[部署与运维实践]]
  - 期望：**存在**
  - 测试点：中文 basename 可通过 analyzer filename index 命中
  - 目标语法：纯中文 basename

### C.3 子目录 + basename

- [[DB/数据库-BufferPool的原理]]
  - 期望：**存在**
  - 测试点：带目录段的 Obsidian 写法可用于消歧
  - 目标语法：`dir/basename`

### C.4 `index` 在当前 demo 配置下的行为

- [[index]]
  - 期望：**存在**，命中 docs 根目录 `index.md`
  - 测试点：当前 demo 的 `repoRoot` 优先于 `obsidianShortest`，因此这里不是 ambiguous broken
  - 目标语法：纯 basename，受 resolution order 影响

## D. Anchor / Alias / 复合写法

这些用例验证锚点、别名和标题渲染之间互不干扰。

### D.1 显式别名

- [[wikilinks-basic-guide|Wiki 基础入门指南]]
  - 期望：**存在**，渲染 label = `Wiki 基础入门指南`
  - 测试点：显式 alias 优先级高于 `render_title`
  - 目标语法：basename + `|alias`

### D.2 链接 + 锚点

- [[wikilinks-basic-guide#基础语法]]
  - 期望：**存在**，href 保留 `#基础语法`
  - 测试点：锚点不参与路径解析，但必须保留在最终链接里
  - 目标语法：basename + `#anchor`

### D.3 链接 + 锚点 + 别名

- [[wikilinks-basic-guide#基础语法|查看「基础语法」章节]]
  - 期望：**存在**，label = `查看「基础语法」章节`，href 保留锚点
  - 测试点：alias、anchor、basename 解析三者不互相污染
  - 目标语法：basename + `#anchor` + `|alias`

### D.4 仅锚点

- [[#结论]]
  - 期望：**非 page candidate**，保留为同页 hash 链接
  - 测试点：纯 hash 不应被送入页面解析，也不应被标 broken
  - 目标语法：`#anchor` only

## E. 扩展名与资源类

这些用例覆盖 `.md`、`.html` 和真实 asset 的分类边界。

### E.1 显式 `.md`

- [[wikilinks-basic-guide.md]]
  - 期望：**存在**
  - 测试点：显式 `.md` 扩展名应解析到同一页面
  - 目标语法：basename + `.md`

### E.2 显式 `.html`

- [[wikilinks-basic-guide.html]]
  - 期望：**存在**
  - 测试点：`.html` 页面候选不应被误判成 asset
  - 目标语法：basename + `.html`

### E.3 真实 asset

- [[boundary-asset.svg]]
  - 期望：**非 page candidate**，按原始 href 保留
  - 测试点：真实 asset 不走 wikilink 页面解析，也不应被标 broken
  - 目标语法：同目录 SVG asset

## F. Index 页面（隐式 / 显式）

这些用例验证目录链接可以稳定落到目录下的 `index.md`。

### F.1 目录隐式 → `index.md`

- [[../../../../../../DB]]
  - 期望：**存在**，解析为 `blogs/DB/index.md`
  - 测试点：目录形式 wikilink 回退到该目录下的 `index.md`
  - 目标语法：相对路径 + 目录名

### F.2 显式 index

- [[../../../../../../DB/index]]
  - 期望：**存在**，解析为 `blogs/DB/index.md`
  - 测试点：显式 `index` 写法与目录隐式写法保持一致
  - 目标语法：相对路径 + `index`

## G. 边角与防御

这些用例验证正则边界、空白输入、特殊字符和 Unicode 输入不会造成异常或错误解析。

### G.1 自引用

- [[wikilinks-boundary-test]]
  - 期望：**存在**，指向当前页面
  - 测试点：自引用可正常解析，不出现死循环或误判 broken
  - 目标语法：当前文件 basename

### G.2 空 wiki

- `[[]]`
  - 期望：**不匹配 wikilink**，原文本保留
  - 测试点：正则要求 target 至少 1 个字符
  - 目标语法：空 target

### G.3 仅空白

- [[   ]]
  - 期望：**broken**，href 回退为 `#`
  - 测试点：trim 后为空字符串，不应解析到 docs 根页面
  - 目标语法：纯空白 target

### G.4 空格与括号

- [[wikilinks-basic-guide (重复)]]
  - 期望：**broken**
  - 测试点：空格和括号不应让 wikilink 正则或解析器异常
  - 目标语法：basename + 空格 + 括号

### G.5 Unicode emoji

- [[这个不存在🚀]]
  - 期望：**broken**
  - 测试点：emoji 输入可稳定进入 broken 分支
  - 目标语法：Unicode / emoji basename

## 结论

issue #434 的关键回归点是让 analyzer、markdown-it wikilink 渲染和最终页面表现共用同一套解析语义：前置斜杠 wikilink 明确 broken，过量 `../` 可以通过唯一 basename 回退，broken href 始终留在站点内部，非页面目标不会被错误标记为 broken。
