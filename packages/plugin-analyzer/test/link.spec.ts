import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { extractInnerLinks } from '../src/parsers/link'

describe('Link Extraction Function Test', () => {
  const readMarkdown = (fileName: string): string => {
    const filePath = path.resolve(__dirname, 'attach', fileName)
    return fs.readFileSync(filePath, 'utf-8')
  }

  it('should correctly extract Markdown links', () => {
    const content = readMarkdown('links-markdown.md')
    const links = extractInnerLinks(content, 'test/attach/links-markdown.md')

    // Verify the number of extracted links
    expect(links.length).toBe(3)

    // Verify link types
    // console.log(links)
    expect(
      links.some((link) => link.relativePath === 'test/attach/relative-path')
    ).toBe(true)
    expect(links.some((link) => link.type === 'markdown')).toBe(true)

    // Verify external links are correctly filtered
    expect(
      links.some((link) => link.relativePath.includes('example.com'))
    ).toBe(false)

    // Verify anchor links
    const anchorLink = links.find((link) => link.raw.includes('#section'))
    expect(anchorLink).toBeDefined()
    expect(anchorLink?.text).toBe('link with anchor')
  })

  it('should correctly extract HTML links', () => {
    const content = readMarkdown('links-html.md')
    const links = extractInnerLinks(content, 'test/attach/links-html.md')

    // Verify the number of extracted links
    expect(links.length).toBeGreaterThan(0)

    // Verify link types
    expect(links.some((link) => link.type === 'html')).toBe(true)

    // Verify HTML links with other attributes
    const specialLink = links.find((link) =>
      link.relativePath.includes('styled-link')
    )
    expect(specialLink).toBeDefined()
    expect(specialLink?.text).toBe('special link')
  })

  it('should correctly extract Wiki links', () => {
    const content = readMarkdown('links-wiki.md')
    const links = extractInnerLinks(content, 'test/attach/links-wiki.md')

    // Verify the number of extracted links
    expect(links.length).toBeGreaterThan(3)

    // Verify link types
    expect(links.some((link) => link.type === 'wiki')).toBe(true)

    // Verify Wiki links with pipe symbol
    console.log(links)
    const pipeLink = links.find((link) => link.text === 'Display Text')
    expect(pipeLink).toBeDefined()
    expect(pipeLink?.relativePath).toContain('Target Path')

    // Verify simple Wiki links
    const simpleLink = links.find((link) => link.text === 'Simple Link')
    expect(simpleLink).toBeDefined()
  })

  it('should handle mixed links in the same content', () => {
    const content = readMarkdown('links-wiki.md')
    const links = extractInnerLinks(content, 'test/attach/links-wiki.md')

    // Verify links in mixed paragraph
    expect(
      links.some((link) => link.text === 'fruits' && link.type === 'wiki')
    ).toBe(true)
    expect(
      links.some((link) => link.text === 'apples' && link.type === 'markdown')
    ).toBe(true)
    expect(
      links.some((link) => link.text === 'bananas' && link.type === 'html')
    ).toBe(true)
  })

  it('should handle empty content', () => {
    const links = extractInnerLinks('', 'test/empty.md')
    expect(links).toEqual([])
  })
})
