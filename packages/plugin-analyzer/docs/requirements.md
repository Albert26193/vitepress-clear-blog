# VitePress Plugin Analyzer

## 1. 插件概述

VitePress Plugin Analyzer 是一个用于分析 VitePress 站点中 Markdown 文档关系和内容的插件。它能够自动扫描并分析文档内容，构建文档之间的关系网络，并提供各种元数据信息。

## 2. 核心功能

### 2.1 文档关系分析

- 分析文档间的链接关系（正向链接和反向链接）
- 支持多种链接格式：
  - Markdown 标准链接 `[text](link)`
  - HTML 链接 `<a href="link">text</a>`
  - Wiki 风格链接 `[[link]]` 或 `[[text|link]]`

### 2.2 文档内容分析

- 提取文档标题
  - 识别第一个 h1 或 h2 标题作为文档主标题
  - 如果没有合适的标题则返回 'no-heading'
- 计算文档字数
  - 支持中英文混合字数统计
  - 自动排除 frontmatter 内容
- 记录文档更新时间

### 2.3 元数据管理

- 为每个 Markdown 文档生成元数据对象，包含：
  ```typescript
  interface PageMetadata {
    outgoingLinks: PageLink[] // 外链列表
    backLinks: PageLink[] // 反向链接列表
    wordCount: number // 字数统计
    rawContent: string // 原始内容
    headings: string[] // 标题列表
    lastUpdated: number // 最后更新时间
  }
  ```

### 2.4 实时更新

- 监听文档变化，自动更新元数据
- 支持开发服务器热更新
- 确保 SSR 和客户端数据同步

## 3. 技术要求

### 3.1 基础环境

- Node.js >= 16.0.0
- VitePress >= 1.5.0

### 3.2 配置选项

- 可配置文档根目录（默认：'docs'）
- 可配置博客目录（默认：'blogs'）

### 3.3 性能要求

- 快速的文件扫描和分析
- 最小化内存占用
- 优化元数据存储结构

## 4. 使用场景

### 4.1 文档网络

- 构建知识图谱
- 展示文档间关系
- 发现孤立文档

### 4.2 内容管理

- 文档统计信息
- 更新追踪
- 内容组织优化

### 4.3 用户界面集成

- 提供反向链接展示
- 显示文档元信息
- 支持文档导航

## 5. 输出接口

### 5.1 Virtual Module

```typescript
import { globalMdMetadata } from 'virtual:vitepress-analyzer'
```

### 5.2 工具函数

```typescript
import { calculateWords } from 'vitepress-plugin-analyzer'
```

## 6. 未来规划

### 6.1 短期目标

- [ ] 优化性能和内存使用
- [ ] 添加更多配置选项
- [ ] 改进链接解析算法

### 6.2 长期目标

- [ ] 支持更多元数据类型
- [ ] 提供图形化关系展示
- [ ] 支持自定义分析器

## 7. 注意事项

- 需要考虑大型文档库的性能问题
- 确保路径解析的跨平台兼容性
- 维护良好的类型定义和文档
