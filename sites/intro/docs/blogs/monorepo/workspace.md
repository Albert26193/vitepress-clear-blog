---
date: 2026-01-22
title: pnpm Workspace
tags:
  - pnpm
  - Workspace
  - Monorepo
  - 依赖管理
description: pnpm 工作区配置详解
---

# pnpm Workspace

> pnpm 工作区配置详解

## 基础配置

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

所有 `packages/` 目录下的包都会被识别为工作区成员。

## workspace 协议

### 内部依赖引用

```json
{
  "dependencies": {
    "vitepress-theme-link": "workspace:*",
    "vitepress-plugin-callouts": "workspace:*"
  }
}
```

### 版本匹配

| 写法 | 说明 |
| ---- | ---- |
| `workspace:*` | 任意版本 |
| `workspace:^` | 兼容版本 |
| `workspace:~` | 补丁版本 |

## 依赖管理

### 添加依赖

```bash
# 添加到根目录
pnpm add -D typescript -w

# 添加到指定包
pnpm add lodash --filter vitepress-theme-link

# 添加内部依赖
pnpm add vitepress-plugin-callouts --filter testbed --workspace
```

### 依赖提升

pnpm 默认采用严格的依赖隔离，但支持配置提升：

```yaml
# .npmrc
shamefully-hoist=true  # 不推荐，除非必要
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
```

## 常用命令

```bash
# 所有包执行命令
pnpm -r <command>

# 并行执行
pnpm --parallel <command>

# 按拓扑顺序
pnpm -r --sort <command>

# 过滤执行
pnpm -F "vitepress-*" build
```

## 相关链接

- [[packages-overview|包职责划分]]
- [[../engineering/build-toolchain|构建工具链]]

---

