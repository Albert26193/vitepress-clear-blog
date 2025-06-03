---
title: Complex Document
description: A test document with complex structure and edge cases
date: 2025-03-15
tags:
  - test
  - complex
  - edge-cases
authors:
  - name: Test Author
    email: test@example.com
---

# Complex Document

This document tests various edge cases and complex structures.

## Nested Links

- Link with [nested [brackets]](doc1.md)
- Link with ![image](image.png)
- Link with [mixed](doc1.md "title")
- HTML <a href="doc2.md">link</a>

## Special Cases

### Empty Links

- []()
- [Empty Target]()
- [](no-target.md)

### Malformed Links

- [Broken Link](broken
- [Another Broken
- [Link with spaces](path with spaces.md)
- [Link with special chars](#$%.md)

### Mixed Content

1. List with [link](doc1.md)
   - Nested list with [another link](doc2.md)
     * Deep nested with [link](doc3.md)

> Blockquote with [link](doc1.md)
> > Nested quote with [link](doc2.md)

### Code Blocks

```markdown
[This link](should-not-count.md) is in a code block
```

`[This link](also-not-counted.md)` is inline code

### Table with Links

| Column 1 | Column 2 |
|----------|----------|
| [Link 1](doc1.md) | [Link 2](doc2.md) |
| Normal text | [Link 3](doc3.md) |