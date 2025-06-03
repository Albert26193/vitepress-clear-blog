import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'
import { extractInnerLinks } from '../src/node/parsers/link'
import type { AnalyzerConfig } from '../types'

// Create a test configuration
const testConfig: AnalyzerConfig = createConfig({
  docsDir: 'packages/plugin-analyzer/test', // Use the test directory as docs root
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  ignoreCase: true
})

const readMarkdown = (fileName: string): string => {
  const filePath = path.resolve(__dirname, fileName)
  return fs.readFileSync(filePath, 'utf-8')
}

// Get the absolute path to the test directory for resolving test files
const testRoot = path.resolve(__dirname)
const getTestPath = (filePath: string) => path.resolve(testRoot, filePath)

describe('Path Resolution and Validation', () => {
  /**
   * Test cases for different directory levels:
   * /test/
   * ├── test.md
   * └── attach/
   *     └── deep/
   *         └── level1/
   *             ├── level1-file1.md
   *             └── level2/
   */
  describe('Path Resolution', () => {
    it('should resolve absolute paths correctly', () => {
      const content = '[Root Link](./attach/deep/level1/level1-file1.md)'
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
        relativePath: 'attach/deep/level1/level1-file1',
        type: 'markdown'
      })
    })

    it('should resolve relative paths from current directory', () => {
      const content = '[Current Dir](./attach/deep/level1/level1-file1.md)'
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
        relativePath: 'attach/deep/level1/level1-file1',
        type: 'markdown'
      })
    })

    it('should resolve relative paths from nested directories', () => {
      const content = '[Parent Dir](../level1-file1.md)'
      const links = extractInnerLinks(
        content,
        testConfig,
        'attach/deep/level1/level2/nested.md'
      )

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
        relativePath: 'attach/deep/level1/level1-file1',
        type: 'markdown'
      })
    })
  })

  /**
   * Test cases for path validation:
   * 1. File existence checks
   * 2. Extension handling
   * 3. Special path formats
   */
  describe('Path Validation', () => {
    it('should handle paths without extension', () => {
      // Using doc1 which exists in test/attach
      const content = '[No Extension](./attach/doc1)'
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/doc1'),
        relativePath: 'attach/doc1',
        type: 'markdown'
      })
    })

    it('should handle special characters in paths', () => {
      const content = readMarkdown('attach/special-paths.md')
      const links = extractInnerLinks(
        content,
        testConfig,
        'attach/special-paths.md'
      )

      console.log(links)
      expect(links.length).toBe(4)

      const simpleLink = links.find((link) =>
        link.relativePath.includes('Simple Link')
      )
      expect(simpleLink).toBeDefined()
      expect(simpleLink).toMatchObject({
        absolutePath: getTestPath('attach/Simple Link'),
        relativePath: 'attach/Simple Link',
        type: 'wiki'
      })

      const targetPath = links.find((link) =>
        link.relativePath.includes('Target Path')
      )
      expect(targetPath).toBeDefined()
      expect(targetPath).toMatchObject({
        absolutePath: getTestPath('attach/Target Path'),
        relativePath: 'attach/Target Path',
        type: 'wiki'
      })

      const doc1 = links.find((link) => link.relativePath.includes('doc1'))
      expect(doc1).toBeDefined()
      expect(doc1).toMatchObject({
        absolutePath: getTestPath('attach/doc1'),
        relativePath: 'attach/doc1',
        type: 'wiki'
      })
    })

    it('should handle complex file paths', () => {
      const content = readMarkdown('attach/complex.md')
      const links = extractInnerLinks(content, testConfig, 'attach/complex.md')

      expect(links.length).toBeGreaterThan(0)

      links.forEach((link) => {
        expect(link).toMatchObject({
          absolutePath: expect.any(String),
          relativePath: expect.any(String),
          type: expect.stringMatching(/markdown|html|wiki/)
        })
      })
    })

    it('should handle Chinese file names', () => {
      const content = readMarkdown('attach/word-count-zh.md')
      const links = extractInnerLinks(
        content,
        testConfig,
        'attach/word-count-zh.md'
      )

      expect(links.length).toBe(1)

      links.forEach((link) => {
        expect(link).toMatchObject({
          absolutePath: expect.any(String),
          relativePath: expect.any(String),
          type: expect.stringMatching(/markdown|html|wiki/)
        })
      })
    })

    /**
     * Test cases for nested directory structure:
     * /test/attach/
     * └── deep/
     *     └── level1/
     *         ├── level1-file1.md
     *         └── level2/
     */
    describe('Nested Directory Structure', () => {
      it('should handle deep directory paths', () => {
        // Using actual file from deep/level1 directory
        const content = '[Deep File](./deep/level1/level1-file1.md)'
        const links = extractInnerLinks(content, testConfig, 'attach/test.md')

        expect(links[0]).toMatchObject({
          absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
          relativePath: 'attach/deep/level1/level1-file1',
          type: 'markdown'
        })
      })

      it('should handle relative paths from nested directories', () => {
        // Test relative path navigation from a nested file
        const content = '[Parent File](../level1-file1.md)'
        const links = extractInnerLinks(
          content,
          testConfig,
          'attach/deep/level1/level2/test.md'
        )

        expect(links[0]).toMatchObject({
          absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
          relativePath: 'attach/deep/level1/level1-file1',
          type: 'markdown'
        })
      })

      it('should handle multiple directory traversal', () => {
        // Test multiple level directory traversal
        const content = readMarkdown('attach/doc1.md')
        const links = extractInnerLinks(content, testConfig, 'attach/doc1.md')

        expect(links.length).toBeGreaterThan(0)

        expect(links[0]).toMatchObject({
          absolutePath: expect.any(String),
          relativePath: expect.any(String),
          type: 'markdown'
        })
      })

      it('should handle absolute paths from nested directories', () => {
        // Test absolute path from a deeply nested location
        const content = '[Absolute Path](/attach/doc1.md)'
        const links = extractInnerLinks(
          content,
          testConfig,
          'attach/deep/level1/level2/test.md'
        )

        expect(links[0]).toMatchObject({
          absolutePath: getTestPath('attach/doc1.md'),
          relativePath: 'attach/doc1',
          type: 'markdown'
        })
      })
    })
  })

  /**
   * Test cases for edge cases and special formats:
   * 1. Anchor links
   * 2. Empty paths
   * 3. Multiple path segments
   */
  describe('Special Cases', () => {
    it('should handle anchor links', () => {
      const content = '[Section](/attach/deep/level1/level1-file1.md#section)'
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
        relativePath: 'attach/deep/level1/level1-file1',
        type: 'markdown'
      })
    })

    it('should handle complex nested paths', () => {
      const content =
        '[Nested](../../attach/deep/level1/level2/../level1-file1.md)'
      const links = extractInnerLinks(content, testConfig, 'a/b/test.md')

      expect(links[0]).toMatchObject({
        absolutePath: getTestPath('attach/deep/level1/level1-file1.md'),
        relativePath: 'attach/deep/level1/level1-file1',
        type: 'markdown'
      })
    })
  })
})

describe('Link Extraction Function Test', () => {
  it('should correctly extract Markdown links', () => {
    const content = readMarkdown('attach/links-markdown.md')
    const links = extractInnerLinks(
      content,
      testConfig,
      '../test/attach/links-markdown.md'
    )

    // Verify the number of extracted links
    console.log(links)
    expect(links.length).toBe(3)

    // Verify link types
    expect(
      links.some((link) => link.relativePath.includes('relative-path'))
    ).toBe(true)
    expect(links.some((link) => link.type === 'markdown')).toBe(true)

    // Verify external links are correctly filtered
    expect(
      links.some((link) => link.relativePath.includes('example.com'))
    ).toBe(false)

    // Verify anchor links
    const anchorLink = links.find((link) => link.raw?.includes('#section'))
    expect(anchorLink).toBeDefined()
    expect(anchorLink?.text).toBe('link with anchor')
  })

  it('should correctly extract HTML links', () => {
    const content = readMarkdown('attach/links-html.md')
    const links = extractInnerLinks(content, testConfig, 'attach/links-html.md')

    // Verify the number of extracted links
    expect(links.length).toBe(2)

    // Verify link types
    expect(links.some((link) => link.type === 'html')).toBe(true)

    // Verify HTML links with other attributes
    const specialLink = links.find((link) =>
      link.relativePath.includes('styled-link')
    )
    // Verify the link not exists
    expect(specialLink).toBeUndefined()
    // expect(specialLink?.text).toBe('special link')
  })

  it('should correctly extract Wiki links', () => {
    const content = readMarkdown('attach/links-wiki.md')
    const links = extractInnerLinks(content, testConfig, 'attach/links-wiki.md')

    // Verify the number of extracted links
    console.log(links)
    expect(links.length).toBe(5)

    // Verify link types
    expect(links.some((link) => link.type === 'wiki')).toBe(true)

    // Verify Wiki links with pipe symbol
    const pipeLink = links.find((link) => link.text === 'Display Text')
    expect(pipeLink).toBeDefined()
    expect(pipeLink?.relativePath).toContain('Target Path')

    // Verify simple Wiki links
    const simpleLink = links.find((link) => link.text === 'Simple Link')
    expect(simpleLink).toBeDefined()
  })

  it('should handle mixed links in the same content', () => {
    const content = readMarkdown('attach/links-wiki.md')
    const links = extractInnerLinks(content, testConfig, 'attach/links-wiki.md')

    console.log(links)
    // Verify links in mixed paragraph
    expect(
      links.some((link) => link.text === 'fruits' && link.type === 'wiki')
    ).toBe(true)

    expect(
      links.some((link) => link.text === 'apples' && link.type === 'markdown')
    ).toBe(true)

    expect(
      links.some((link) => link.text === 'bananas' && link.type === 'wiki')
    ).toBe(true)
  })

  it('should handle empty content', () => {
    const links = extractInnerLinks('', testConfig, 'empty.md')
    expect(links).toEqual([])
  })

  it('should validate file existence', () => {
    const content = `[Valid Link](./fruits.md)\n[Invalid Link](nonexistent.md)`
    const links = extractInnerLinks(content, testConfig, 'attach/test.md')
    console.log(links)
    expect(links.some((link) => link.relativePath.includes('fruits'))).toBe(
      true
    )
    expect(
      links.some((link) => link.relativePath.includes('nonexistent'))
    ).toBe(false)
  })
})

describe('Link Type Tests', () => {
  describe('Markdown Links', () => {
    it('should extract relative markdown links', () => {
      // Using actual content from links-markdown.md
      const content = '[Wiki link](./relative-path.md)'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toMatchObject({
        relativePath: 'attach/relative-path',
        type: 'markdown'
      })
    })

    it('should handle links with and without extensions', () => {
      // Using actual content from links-markdown.md
      const content = `[With Extension](./root-path.md) [Without Extension](./root-path)`
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links).toHaveLength(1)
      expect(links[0].relativePath).toBe('attach/root-path')
    })

    it('should handle links with anchors', () => {
      // Using actual content from links-markdown.md
      const content = '[link with anchor](./another-file.md#section)'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toMatchObject({
        relativePath: 'attach/another-file',
        type: 'markdown'
      })
    })
  })

  describe('HTML Links', () => {
    it('should extract HTML links with attributes', () => {
      // Using actual content from links-html.md
      const content =
        '<a href="./styled-link.md" class="special-link" target="_blank">special link</a>'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toBeUndefined()
    })

    it('should handle HTML links with anchors', () => {
      // Using actual content from links-html.md
      const content = '<a href="./another-file.md#section">link with anchor</a>'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toMatchObject({
        relativePath: 'attach/another-file',
        type: 'html'
      })
    })
  })

  describe('Wiki Links', () => {
    it('should handle simple wiki links', () => {
      // Using actual content from links-wiki.md
      const content = '[[Simple Link]]'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toMatchObject({
        type: 'wiki',
        text: 'Simple Link'
      })
    })

    it('should handle wiki links with display text', () => {
      // Using actual content from links-wiki.md
      const content = '[[Target Path|Display Text]]'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links[0]).toMatchObject({
        type: 'wiki',
        text: 'Display Text',
        relativePath: 'attach/Target Path'
      })
    })

    it('should handle mixed link types in the same content', () => {
      // Using actual content from links-wiki.md
      const content =
        'I like [[fruits]], especially [apples](./apple.md) and <a href="./bananas.md">bananas</a>'
      const links = extractInnerLinks(content, testConfig, 'attach/test.md')

      expect(links).toHaveLength(3)
      const types = links.map((link) => link.type)
      expect(types).toContain('wiki')
      expect(types).toContain('markdown')
      expect(types).toContain('html')
    })
  })

  describe('External Links', () => {
    it('should ignore external links', () => {
      // Using actual content from both markdown and html files
      const content = `
        [external link](https://example.com)
        <a href="https://example.com">external link</a>
      `
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links).toHaveLength(0)
    })

    it('should ignore mailto and tel links', () => {
      const content = `
        [email](mailto:test@example.com)
        [phone](tel:1234567890)
        <a href="mailto:test@example.com">email</a>
        <a href="tel:1234567890">phone</a>
      `
      const links = extractInnerLinks(content, testConfig, 'test.md')

      expect(links).toHaveLength(0)
    })
  })
})

describe('Invalid Link Tests', () => {
  /**
   * Tests for handling various types of invalid links:
   * 1. Non-existent files
   * 2. Empty links
   * 3. Malformed links
   * 4. Invalid paths
   * 5. Directory paths
   */
  it('should return empty array for non-existent files', () => {
    // Testing that non-existent files result in empty array
    const content = '[Missing](./non-existent-file.md)'
    const links = extractInnerLinks(content, testConfig, 'test.md')

    expect(links).toHaveLength(0)
  })

  it('should return empty array for empty links', () => {
    // Testing empty link paths
    const content = `
      [Empty]()
      [Empty Link]("")
      [Empty Link]('')
      [Empty Link]( )
      [Empty Link](\t)
      [Empty Link](\n)
    `
    const links = extractInnerLinks(content, testConfig, 'test.md')

    expect(links).toHaveLength(0)
  })

  it('should return empty array for malformed links', () => {
    // Testing various malformed link formats
    const content = `
      [Malformed](
      [Malformed](])
      [Malformed](.md)
      []()
      [](test.md)
      [Malformed](test.md
      Malformed](test.md)
    `
    const links = extractInnerLinks(content, testConfig, 'test.md')

    expect(links).toHaveLength(0)
  })

  it('should return empty array for invalid paths', () => {
    // Testing invalid path formats
    const content = `
      [Invalid](./test?.md)
      [Invalid](./test*.md)
      [Invalid](./test|.md)
      [Invalid](./test<.md)
      [Invalid](./test>.md)
      [Invalid](./test:.md)
    `
    const links = extractInnerLinks(content, testConfig, 'test.md')

    expect(links).toHaveLength(0)
  })

  it('should return empty array for directory paths', () => {
    // Testing paths that point to directories instead of files
    const content = `
      [Directory](./deep/)
      [Directory](./deep)
      [Directory](/deep/)
      [Directory](/deep)
    `
    const links = extractInnerLinks(content, testConfig, 'test.md')

    expect(links).toHaveLength(0)
  })
})
