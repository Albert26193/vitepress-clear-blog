---
title: Mermaid 图表类型大全
date: 2026-05-10
tags:
  - mermaid
  - diagrams
  - visualization
  - extension
description: 覆盖 Mermaid 全系列图表类型：流程图、时序图、类图、状态图、甘特图、饼图等
---

# Mermaid 图表类型大全

Mermaid 扩展支持在 Markdown 中书写 20+ 种图表类型。本文是完整的语法展示。

## 流程图

```mermaid
flowchart TD
    A[开始] --> B{是否登录?}
    B -->|是| C[进入首页]
    B -->|否| D[跳转登录]
    D --> E[输入凭据]
    E --> F{验证}
    F -->|通过| C
    F -->|失败| D
    C --> G[结束]
```

## 带样式的流程图

```mermaid
flowchart LR
    A:::start --> B
    B --> C:::process
    C --> D{决策}
    D -->|路径A| E[结果A]
    D -->|路径B| F[结果B]
    classDef start fill:#90EE90,stroke:#333
    classDef process fill:#87CEEB,stroke:#333
```

## 时序图

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as API
    participant D as 数据库

    U->>F: 点击登录
    F->>A: POST /auth/login
    A->>D: 查询用户
    D-->>A: 返回用户信息
    A-->>F: 返回 JWT Token
    F-->>U: 跳转首页
```

## 带循环和条件的时序图

```mermaid
sequenceDiagram
    actor Client
    participant Server
    participant Worker

    Client->>Server: 提交批处理任务
    loop 处理每个项目
        Server->>Worker: 下发任务
        alt 处理成功
            Worker-->>Server: 返回结果
        else 处理失败
            Worker-->>Server: 返回错误
        end
    end
    Server-->>Client: 汇总报告
```

## 类图

```mermaid
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Admin {
        +String role
        +manageUsers()
    }
    class Post {
        +String title
        +Date createdAt
        +publish()
    }
    User <|-- Admin
    User "1" --> "*" Post : creates
```

## 状态图

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review: submit
    Review --> Draft: reject
    Review --> Published: approve
    Published --> Archived: archive
    Published --> Draft: unpublish
    Archived --> [*]
```

## 实体关系图

```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER {
        int id PK
        string name
        string email
    }
    POST {
        int id PK
        string title
        datetime created_at
    }
    POST ||--o{ TAG : has
    TAG {
        int id PK
        string name
    }
```

## 甘特图

```mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析      :done,    des1, 2026-01-01, 7d
    UI 设计       :done,    des2, 2026-01-08, 5d
    section 开发阶段
    后端开发      :active,  dev1, 2026-01-13, 10d
    前端开发      :         dev2, 2026-01-15, 12d
    section 测试阶段
    集成测试      :         tst1, 2026-01-27, 5d
    上线部署      :         tst2, 2026-02-01, 2d
```

## 饼图

```mermaid
pie showData
    title 技术栈使用分布
    "TypeScript" : 45
    "Python" : 25
    "Go" : 15
    "Rust" : 10
    "Other" : 5
```

## Git 分支图

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout develop
    merge feature
    checkout main
    merge develop
    commit tag: "v1.0"
```

## 思维导图

```mermaid
mindmap
  root((博客系统))
    内容管理
      Markdown 编辑
      Frontmatter
      图片管理
    主题系统
      颜色方案
      暗色模式
      排版定制
    扩展功能
      Wikilinks
      Callout
      Mermaid
      MathJax
```

## 时间线图

```mermaid
timeline
    title 版本发布历史
    2025 Q4 : v1.0 发布 : 基础博客功能
    2026 Q1 : v1.5 发布 : Wikilinks & Callout
    2026 Q2 : v2.0 发布 : 全扩展支持
```

## Sankey 图

```mermaid
sankey-beta
    用户访问,首页,500
    首页,博客列表,400
    首页,标签页,100
    博客列表,文章详情,350
    标签页,文章详情,80
```

## 象限图

```mermaid
quadrantChart
    title 技术评估矩阵
    x-axis 低复杂度 --> 高复杂度
    y-axis 低收益 --> 高收益
    quadrant-1 优先实施
    quadrant-2 战略投资
    quadrant-3 低优先级
    quadrant-4 快速见效
    Mermaid: [0.7, 0.8]
    MathJax: [0.4, 0.6]
    RSS: [0.2, 0.3]
    Wikilinks: [0.6, 0.9]
```

## 相关文档

- [[../callout-types|Callout 类型]]
- [[../mathjax-showcase|MathJax 展示]]
- [[../markdown-features|Markdown 功能总览]]
- [[../../d3-force-graph|D3 力导向图]]
