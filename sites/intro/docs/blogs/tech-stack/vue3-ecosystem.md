---
page_id: "vue3-ecosystem"
date: 2026-01-24
title: Vue3 生态
tags:
  - Vue3
  - VueUse
  - UnoCSS
  - Composition API
description: Vue 3 及其生态系统在项目中的应用
---

# Vue3 生态

> Vue 3 及其生态系统在项目中的应用

## Vue 3.5 核心特性

### Composition API

项目全面采用 Composition API：

```typescript
// 示例：使用 composable
import { useData } from 'vitepress'
import { computed } from 'vue'

const { frontmatter, page } = useData()
const title = computed(() => frontmatter.value.title)
```

### `<script setup>`

所有组件使用 `<script setup>` 语法：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
```

## VueUse 工具库

项目集成了 VueUse 提供的实用 composables：

| 功能 | Hook |
| ---- | ---- |
| 暗色模式 | `useDark` |
| 本地存储 | `useLocalStorage` |
| 窗口尺寸 | `useWindowSize` |
| 滚动位置 | `useScroll` |

## UnoCSS 原子化 CSS

### 配置示例

```typescript
// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/'
    })
  ]
})
```

### 使用示例

```html
<div class="flex items-center gap-4 p-4 rounded-lg bg-gray-100">
  <span class="i-carbon-sun text-xl" />
  <span>Hello World</span>
</div>
```

## 相关链接

- [[vitepress|VitePress 框架]] - 框架基础
- [[visualization|可视化方案]] - 数据可视化

---

