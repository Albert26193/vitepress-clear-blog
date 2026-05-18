---
title: CI/CD 流水线配置实战
date: 2026-05-04
tags:
  - ci-cd
  - devops
  - github-actions
  - automation
description: 使用 GitHub Actions 构建自动化部署流水线的完整指南
---

# CI/CD 流水线配置实战

GitHub Actions 是实现 CI/CD 的主流工具。本文涵盖从基础 Workflow 到高级流水线设计。

## 基础 Workflow 结构

```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

## Matrix 并行构建

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm test:unit
```

Matrix 构建让你在多个 Node.js 版本和操作系统上并行执行测试，大幅缩短验证时间。

## 缓存策略

```yaml
- uses: pnpm/action-setup@v4
  with:
    run_install: false
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
```

GitHub Actions 内置的 `cache: 'pnpm'` 比手动配置缓存更简洁可靠。

## 环境变量与 Secrets

```yaml
env:
  NODE_ENV: production
steps:
  - run: pnpm deploy
    env:
      DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

敏感信息（Token、私钥、API 密钥）存入仓库 Settings > Secrets，在 Workflow 中引用。

## PR 预览部署

结合 GitHub Pages 或 Vercel，可以在 PR 打开时自动部署预览环境，PR 关闭时清理，实现可视化代码评审。

## 相关文档

- [[../部署与运维实践]]
- [[../../blogs/navigation/nav-bar-configuration|导航栏配置]]
- [[../../blogs/deployment-guide|部署指南]]
