---
page_id: "mermaid-diagrams-comprehensive"
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

## 复杂状态机：自动修复流程

这个示例用于验证复杂状态机、换行标签、分支终态和真实工作流转移。

```mermaid
stateDiagram-v2
    [*] --> Step1_Init

    Step1_Init: Step 1 初始化\n创建 run-dir / 写 s1_issue.md
    Step2_Intake: Step 2 信息量门禁\n写 s2_bug_context.md
    Step3_Complexity: Step 3 复杂性门禁\n写 s3_feasibility.md
    Step4_LocalVerify: Step 4 本地验证 best-effort\n写 s4_local_verify.md
    Step5_RepairLoop: Step 5 Repair Loop\n最多 3 轮 attempt
    Step6_Closeout: Step 6 Closeout\n写 s6_final_report.md / s6_comment.md

    Fixed: FIXED\nbuild + MTR 通过
    NeedsHuman: NEEDS_HUMAN\n信息不足 / 范围过大 / 验证失败
    Failed: FAILED\n确认非代码 bug 或路线不可修复

    Step1_Init --> Step6_Closeout: 无入口信息
    Step1_Init --> Step2_Intake: 有 TAPD / Issue / 具体描述

    Step2_Intake --> Step3_Complexity: PASS
    Step2_Intake --> Step6_Closeout: FAIL / 信息不足

    Step3_Complexity --> Step4_LocalVerify: PASS
    Step3_Complexity --> Step6_Closeout: NEEDS_HUMAN / FAILED

    Step4_LocalVerify --> Step5_RepairLoop: PASS / confirmed
    Step4_LocalVerify --> Step5_RepairLoop: PASS / static_only
    Step4_LocalVerify --> Step5_RepairLoop: PASS / skipped_intrinsic
    Step4_LocalVerify --> Step5_RepairLoop: PASS / skipped_env
    Step4_LocalVerify --> Step6_Closeout: NEEDS_HUMAN / inconclusive

    Step5_RepairLoop --> Step5_RepairLoop: patch/build/MTR 失败\n且可归因本轮 patch\nattempt < 3
    Step5_RepairLoop --> Step6_Closeout: MTR 通过
    Step5_RepairLoop --> Step6_Closeout: attempt 超限 / 环境问题 / 证据不足

    Step6_Closeout --> Fixed: 终态 FIXED\n自动 commit，不 push
    Step6_Closeout --> NeedsHuman: 终态 NEEDS_HUMAN\n默认 iWiki + TAPD 写回
    Step6_Closeout --> Failed: 终态 FAILED\n默认 iWiki + TAPD 写回

    Fixed --> [*]
    NeedsHuman --> [*]
    Failed --> [*]
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
