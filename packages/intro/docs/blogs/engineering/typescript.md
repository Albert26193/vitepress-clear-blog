---
date: 2026-01-23
title: TypeScript 配置
tags:
  - TypeScript
  - 类型系统
  - 严格模式
description: 项目的 TypeScript 类型系统配置
---

# TypeScript 配置

> 项目的 TypeScript 类型系统配置

## 基础配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

## 严格模式

项目启用了 TypeScript 严格模式：

| 选项 | 值 | 说明 |
| ---- | ---- | ---- |
| `strict` | true | 启用所有严格检查 |
| `noImplicitAny` | true | 禁止隐式 any |
| `strictNullChecks` | true | 严格空值检查 |
| `noUncheckedIndexedAccess` | true | 索引访问检查 |

## Monorepo 配置

### 项目引用

```json
{
  "references": [
    { "path": "./packages/theme" },
    { "path": "./packages/docs" },
    { "path": "./packages/vitepress-plugin-callout" }
  ]
}
```

### 路径别名

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 类型声明

### 插件类型导出

```typescript
// src/types/index.ts
export interface PluginOptions {
  enabled?: boolean
  theme?: 'light' | 'dark'
}

export type { PluginOptions as default }
```

## 相关链接

- [[eslint-prettier|ESLint & Prettier]]
- [[build-toolchain|构建工具链]]

---

