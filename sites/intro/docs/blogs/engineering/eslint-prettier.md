---
date: 2026-01-23
title: ESLint & Prettier
tags:
  - ESLint
  - Prettier
  - 代码规范
  - lint-staged
description: 代码质量与格式化配置
---

# ESLint & Prettier

> 代码质量与格式化配置

## ESLint 配置

### Flat Config (ESLint 9.x)

项目采用 ESLint 9.x 的新版 Flat Config：

```javascript
// eslint.config.js
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    rules: {
      // 自定义规则
    }
  }
]
```

### 核心规则

| 规则 | 配置 | 说明 |
| ---- | ---- | ---- |
| `no-unused-vars` | error | 禁止未使用变量 |
| `@typescript-eslint/explicit-function-return-type` | off | 允许推断返回类型 |
| `vue/multi-word-component-names` | off | 允许单词组件名 |

## Prettier 配置

```javascript
// prettier.config.js
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  printWidth: 100,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss'
  ]
}
```

## 协同工作

### 解决冲突

使用 `eslint-config-prettier` 关闭与 Prettier 冲突的 ESLint 规则：

```javascript
import prettier from 'eslint-config-prettier'

export default [
  // ... 其他配置
  prettier
]
```

### lint-staged 集成

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{css,scss,md}": ["prettier --write"]
  }
}
```

## 相关链接

- [[typescript|TypeScript 配置]]
- [[commit-lint|Git 提交规范]]

---

