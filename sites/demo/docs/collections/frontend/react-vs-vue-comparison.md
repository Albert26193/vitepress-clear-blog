---
title: React 与 Vue 组件设计对比
date: 2026-05-03
tags:
  - react
  - vue3
  - frontend
  - comparison
description: 从组件模型、状态管理、生态工具角度对比 React 与 Vue 的核心理念
---

# React 与 Vue 组件设计对比

React 和 Vue 是前端两大主流框架。本文从组件模型、状态管理和生态工具角度进行对比分析。

## 组件模型

### React：Hooks + JSX

```tsx
import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.title = `Count: ${count}`
  }, [count])

  return <button onClick={() => setCount(count + 1)}>+1</button>
}
```

### Vue：Composition API + SFC

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (val) => {
  document.title = `Count: ${val}`
})
</script>

<template>
  <button @click="count++">+1</button>
</template>
```

## 状态管理

| 方面 | React | Vue |
|------|-------|-----|
| 内置方案 | Context + useReducer | Pinia |
| 响应式 | 不可变 + setState | Proxy 代理 |
| 中间件生态 | Redux/Zustand/Jotai | Pinia 插件 |
| TypeScript 支持 | 良好 | 原生 |

## 性能策略

- **React**：`React.memo`、`useMemo`、`useCallback` 手动优化
- **Vue**：编译器自动优化 + `v-memo`、`shallowRef` 手动控制

## 生态与社区

React 的第三方生态更大（Next.js、React Native），Vue 的官方工具链更完整（Vite、Pinia、Vue Router 均由核心团队维护）。

## 相关文档

- [[../vue3-composition-api|Vue 3 实践指南]]
- [[../../blogs/theme/dark-mode-customization|暗色模式配置]]
- [[../../blogs/navigation/page-layouts-overview|页面布局总览]]
