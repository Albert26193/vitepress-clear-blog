---
page_id: "rss-feed-test"
title: RSS Feed Integration Test
date: 2026-05-09
tags:
  - rss
  - test
---

# RSS Feed Integration Test

This post verifies that the RSS feed correctly picks up new blog posts.

## Full Text Rendering

RSS feeds should include the **full content** of each post, not just titles.
This paragraph tests that rich content — including **bold**, *italic*,
`inline code`, and [links](https://example.com) — is preserved in the feed.

## Code Block Test

```typescript
function greet(name: string): string {
  return `Hello, ${name}! Welcome to the RSS feed test.`
}

console.log(greet('Reader'))
```

## List Test

- Item one: RSS feed generation
- Item two: Full text content
- Item three: Code blocks in feeds

## Quote Test

> The best way to predict the future is to invent it.
> — Alan Kay

## MathJax Test

Inline: $E = mc^2$

Block:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

## Conclusion

If you can read all of this in the RSS reader, the feed is working correctly
with full-text content rendering.

## 延伸阅读

- [[theme/rss-seo-and-sitemap|RSS、SEO 与站点地图]]
- [[deployment-guide|部署指南]]
- [[getting-started|入门教程]]
- [[basics/code-and-syntax-highlight|代码块与语法高亮]]
