import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/core/config'
import type { AnalyzerConfig } from '../src/core/config'
import { analyzeAllDocuments, analyzeDocument } from '../src/parsers/meta'

// Create a test configuration
const testConfig: AnalyzerConfig = createConfig({
  docsDir: 'packages/plugin-analyzer/test',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  ignoreCase: true
})

/**
 * Helper function to read test files
 * @param filename - Name of the test file
 * @returns Content of the file
 */
const readTestFile = (filename: string): string => {
  const path = resolve(__dirname, 'attach', filename)
  console.log('path', path)
  return readFileSync(path, 'utf-8')
}

describe('Document Analyzer', () => {
  describe('Basic Document Analysis', () => {
    it('should analyze document structure', () => {
      const content = readTestFile('doc1.md')
      const metadata = analyzeDocument(content, testConfig, './attach/doc1.md')

      console.log('meta', metadata)
      expect(metadata).toMatchObject({
        firstHeading: 'Document 1',
        outgoingLinks: expect.arrayContaining([
          expect.objectContaining({
            text: 'Document 2',
            relativePath: 'attach/doc2',
            absolutePath: `${__dirname}/attach/doc2.md`,
            type: 'markdown'
          }),
          expect.objectContaining({
            text: 'self link',
            relativePath: 'attach/doc1',
            absolutePath: `${__dirname}/attach/doc1.md`,
            type: 'markdown'
          })
        ]),
        wordCount: expect.any(Number),
        lastUpdated: expect.any(Number)
      })
    })

    it('should handle document without headings', () => {
      const content = 'Just some text without any headings'
      const metadata = analyzeDocument(content, testConfig, 'no-heading.md')

      expect(metadata.firstHeading).toBe('no-heading')
    })

    it('should calculate word count correctly', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(content, testConfig, 'attach/doc2.md')

      console.log('metadata', metadata)
      // Doc2 has specific number of words (excluding frontmatter)
      expect(metadata.wordCount).toBe(16)
    })
  })

  describe('Document Relationships', () => {
    it('should build relationships using analyzeAllDocuments', () => {
      // Create a test directory structure for this test
      const testDocsDir = 'packages/plugin-analyzer/test/attach'

      // Create a test config with the test directory
      const testDirConfig = createConfig({
        docsDir: testDocsDir,
        excludeDirs: ['node_modules', '.git', 'dist'],
        includeFiles: ['.md'],
        excludeFiles: [],
        ignoreCase: true
      })

      // Analyze all documents in the test directory
      const globalMetadata = analyzeAllDocuments(testDirConfig)

      // Check that we have metadata for doc1 and doc2
      expect(globalMetadata['doc1']).toBeDefined()
      expect(globalMetadata['doc2']).toBeDefined()

      // Check doc1's backlinks
      expect(globalMetadata['doc1'].backLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'markdown'
          })
        ])
      )

      // Check doc2's backlinks
      expect(globalMetadata['doc2'].backLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'markdown'
          })
        ])
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing documents gracefully', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(content, testConfig, './attach/doc2.md')
      console.log('metadata', metadata)
      expect(metadata.outgoingLinks).not.toContain(
        expect.objectContaining({
          text: 'Missing Document',
          relativePath: 'attach/doc3',
          type: 'markdown'
        })
      )
    })
  })
})
