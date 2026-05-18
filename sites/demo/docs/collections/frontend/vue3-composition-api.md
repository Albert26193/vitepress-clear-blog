---
title: Vue 3 Composition API 实践指南
date: 2026-05-02
tags:
  - vue3
  - composition-api
  - frontend
  - 响应式
description: Vue 3 组合式 API 的核心模式、响应式系统与实战技巧
---

# Vue 3 Composition API 实践指南

Vue 3 的 Composition API 提供了更灵活的逻辑组织方式。本指南覆盖从基础到进阶的核心模式。

## ref 与 reactive

`ref` 用于基础类型的响应式包装，`reactive` 用于对象：

```ts
import { ref, reactive } from 'vue'

const count = ref(0)
const state = reactive({ name: 'Vue', version: 3 })

// ref 需要通过 .value 访问
count.value++

// reactive 直接访问属性
state.name = 'Vue 3'
```

选择原则：简单值用 `ref`，复杂对象用 `reactive`。大型项目中推荐统一使用 `ref` 配合 `toRefs` 解构。

## computed 与 watch

```ts
import { computed, watch, watchEffect } from 'vue'

const doubleCount = computed(() => count.value * 2)

// watch 侦听特定源
watch(count, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// watchEffect 自动追踪依赖
watchEffect(() => {
  console.log(`The double is ${doubleCount.value}`)
})
```

### computed vs watch 选择

- `computed`：派生数据，有缓存，模板中直接使用。
- `watch`：副作用执行（API 请求、DOM 操作）。
- `watchEffect`：不需要明确指定依赖时更简洁。

## script setup 语法糖

`<script setup>` 是推荐的写法，导入即注册：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue 3')
</script>

<template>
  <h1>{{ message }}</h1>
</template>
```

组件无需显式注册，defineProps 和 defineEmits 自动可用。

## 生命周期钩子

```ts
import { onMounted, onUnmounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  console.log('组件已挂载')
})

onBeforeUnmount(() => {
  console.log('组件即将卸载')
})
```

## 相关文档

- [[../react-vs-vue-comparison|React 与 Vue 对比]]
- [[../../blogs/extensions/hashtag-discovery|Hashtag 标签发现]]
- [[../../blogs/basics/tables-lists-images|表格列表图片]]
- [[../../blogs/theme/typography-and-fonts|排版与字体]]
