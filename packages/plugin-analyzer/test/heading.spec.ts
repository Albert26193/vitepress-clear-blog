import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { extractFirstHeading } from '../src/parsers/heading'

describe('Heading Extraction Function Test', () => {
  const readMarkdown = (fileName: string): string => {
    const filePath = path.resolve(__dirname, 'attach', fileName)
    return fs.readFileSync(filePath, 'utf-8')
  }

  it('should correctly extract H1 heading', () => {
    const content = readMarkdown('heading-h1.md')
    const heading = extractFirstHeading(content)
    expect(heading).toBe('This is an H1 Title')
  })

  it('should correctly extract H2 heading', () => {
    const content = readMarkdown('heading-h2.md')
    const heading = extractFirstHeading(content)
    expect(heading).toBe('This is an H2 Title')
  })

  it('should return special marker when first heading is H3', () => {
    const content = readMarkdown('heading-h3.md')
    const heading = extractFirstHeading(content)
    expect(heading).toBe('no-heading')
  })

  it('should return special marker when document has no heading', () => {
    const content = readMarkdown('no-heading.md')
    const heading = extractFirstHeading(content)
    expect(heading).toBe('no-heading')
  })

  it('should handle empty content', () => {
    const heading = extractFirstHeading('')
    expect(heading).toBeNull()
  })

  it('should ignore headings nested in code blocks', () => {
    const content =
      '```markdown\n# This is a heading in a code block\n```\n\n## This is the real heading'
    const heading = extractFirstHeading(content)
    expect(heading).toBe('This is the real heading')
  })
})
