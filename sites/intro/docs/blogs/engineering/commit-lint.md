---
date: 2026-01-23
title: Git 提交规范
tags:
  - Git
  - Husky
  - Commitlint
  - Conventional Commits
description: Husky + Commitlint 实现的提交规范
---

# Git 提交规范

> Husky + Commitlint 实现的提交规范

## Conventional Commits

项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 示例 |
| ---- | ---- | ---- |
| `feat` | 新功能 | `feat(theme): add dark mode` |
| `fix` | 修复 | `fix(plugin): resolve memory leak` |
| `docs` | 文档 | `docs: update README` |
| `style` | 格式 | `style: format code` |
| `refactor` | 重构 | `refactor(core): simplify logic` |
| `perf` | 性能 | `perf: optimize bundle size` |
| `test` | 测试 | `test: add unit tests` |
| `chore` | 杂项 | `chore: update dependencies` |

## Husky 配置

### 安装与初始化

```bash
pnpm add -D husky
npx husky init
```

### Git Hooks

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1

# .husky/pre-commit
npx lint-staged
```

## Commitlint 配置

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 
       'perf', 'test', 'chore', 'revert']
    ],
    'subject-case': [0]
  }
}
```

## 工作流示例

```bash
# 1. 修改代码
git add .

# 2. 提交（会触发 hooks）
git commit -m "feat(intro): add documentation structure"

# 3. 如果提交信息不规范，会被拒绝
# ✖ subject may not be empty
# ✖ type may not be empty
```

## 相关链接

- [[eslint-prettier|ESLint & Prettier]]
- [[build-toolchain|构建工具链]]

---

