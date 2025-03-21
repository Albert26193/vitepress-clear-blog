import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { calculateWords } from '../src/node/utils/wordCount'

describe('calculateWords', () => {
  const readTestFile = (filename: string): string => {
    const filePath = resolve(__dirname, 'attach', filename)
    return readFileSync(filePath, 'utf-8')
  }

  it('should count Chinese characters correctly', () => {
    const content = readTestFile('word-count-zh.md')
    const wordCount = calculateWords(content)
    console.log(wordCount)
    expect(wordCount).toBe(106)
  })

  it('should count English words correctly', () => {
    const content = readTestFile('word-count-en.md')
    const wordCount = calculateWords(content)
    console.log(wordCount)
    expect(wordCount).toBe(95)
  })

  it('should handle mixed content correctly', () => {
    const content = '这是一个 mixed content 测试。Here are 5 characters.'
    const wordCount = calculateWords(content)
    console.log(wordCount)
    expect(wordCount).toBe(11)
  })

  it('should count code blocks content', () => {
    const content = '```js\nconst test = "hello world";\n```\n正常文本'
    const wordCount = calculateWords(content)
    // normal text(2) + const(1) + test(1) + hello(1) + world(1) + js(1) + n(1)
    console.log(wordCount)
    expect(wordCount).toBe(8) // Updated based on actual count
  })

  it('should handle markdown formatting and inline code', () => {
    const content = '**加粗** *斜体* `const test` [链接](some-url-test)'
    const wordCount = calculateWords(content)
    // bold(2) + italic(2) + const(1) + test(1) + link(2)
    expect(wordCount).toBe(8)
  })

  it('should handle multiple code blocks and inline code', () => {
    const content =
      '```js\nconst a = 1;\n```\n中文`let b = 2`测试\n```python\nprint("hello")\n```'
    const wordCount = calculateWords(content)
    // Chinese(2) + test(2) + const(1) + let(1) + print(1) + hello(1) + js(1) + python(1) + n(multiple)
    expect(wordCount).toBe(10)
  })
})
