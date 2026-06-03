---
title: 代码块与语法高亮配置
date: 2026-05-07
tags:
  - markdown
  - code
  - syntax-highlighting
  - shiki
description: 代码围栏、行号、行高亮、code-group 与多语言切换的完整演示
---

# 代码块与语法高亮

VitePress 使用 Shiki 作为语法高亮引擎。本文展示所有代码块功能。

代码高亮主题可以通过 `.vitepress/config.toml` 配置：

```toml
[markdown.theme]
light = "github-light"
dark = "ayu-dark"
```

只想使用单一主题时，也可以写成 `[markdown] theme = "github-light"`。

## 围栏代码块

````markdown
```ts
const hello = 'world'
```
````

效果：

```ts
const hello: string = 'world'
console.log(hello)
```

## 多语言支持

```ts
// TypeScript
interface User {
  name: string
  age: number
}
```

```python
# Python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

```go
// Go
func main() {
    fmt.Println("Hello, 世界")
}
```

```rust
// Rust
fn main() {
    let greeting = String::from("Hello, Rust");
    println!("{}", greeting);
}
```

```bash
# Shell
for i in {1..5}; do
    echo "Loop $i"
done
```

## 行号与行高亮

```ts {2,4-5}
// 高亮第 2 行和第 4-5 行
function greet(name: string): string {
  const greeting = `Hello, ${name}`
  console.log(greeting)
  return greeting
}
```

## 代码组（code-group）

```ts [config.ts]
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Site',
  description: 'A VitePress site'
})
```

```toml [config.toml]
[meta]
title = "My Site"
description = "A VitePress site"
```

## 行内代码

使用反引号包裹：`const x = 1`、`Array.prototype.map`、`/^regex$/`。

## 相关文档

- [[../text-formatting|文本格式化]]
- [[../tables-lists-images|表格列表图片]]
- [[../extensions/mathjax-showcase|MathJax 展示]]
- [[../../getting-started|入门教程]]
