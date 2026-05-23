---
title: 导航栏配置完全指南
date: 2026-05-18
tags:
  - navigation
  - config
  - nav-bar
description: 通过 config.toml 的 [nav] 区块自定义顶部导航栏标签文案
---

# 导航栏配置完全指南

VitePress Theme Link 通过 `config.toml` 中的 `[nav]` 区块提供导航栏文案的集中管理。

## [nav] 配置

```toml
[nav]
home = "Home"
tags = "Tags"
timeline = "Timeline"
pages = "Pages"
about = "About"
```

每个字段控制顶部导航栏对应标签的显示文案：

- **home** — 首页按钮文案
- **tags** — 标签页导航文案
- **timeline** — 时间线页导航文案
- **pages** — 文章列表页导航文案
- **about** — 关于页导航文案

## 国际化

通过 `[meta]` 区块的 `locale` 和 `lang` 配合 `[nav]` 实现多语言：

```toml
[meta]
locale = "zh_CN"
lang = "zh-CN"

[nav]
home = "首页"
tags = "标签"
timeline = "时间线"
pages = "文章"
about = "关于"
```

## 导航逻辑

顶部导航栏的显示逻辑：

1. `home` 始终显示，链接到 `/`
2. `tags` 链接到 `/tags.html`
3. `timeline` 链接到 `/timeline.html`
4. `pages` 链接到 `/pages/`
5. `about` 链接到 `/about.html`

每个导航项的页面需要对应的 `.md` 文件存在。

## 与 VitePress socialLinks 的关系

在 `config.ts` 中还可以配置社交链接：

```ts
export default defineConfig({
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/user/repo' }
    ]
  }
})
```

socialLinks 出现在导航栏右侧，通常用于 GitHub、Twitter 等外部链接。

## 相关文档

- [[../../customizing-theme|定制主题]]
- [[../sidebar-and-outline|侧边栏与目录]]
- [[../page-layouts-overview|页面布局]]
