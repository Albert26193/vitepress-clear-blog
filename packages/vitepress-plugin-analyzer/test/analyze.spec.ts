import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'
import {
  analyzeAllDocuments,
  analyzeDocument,
  scanDirectory
} from '../src/node/parsers/analyze'
import type { AnalyzerConfig, PageMetadata, SitePages } from '../types'

// Create a test configuration using absolute path to avoid process.cwd() issues
const testConfig: AnalyzerConfig = createConfig({
  docsDir: resolve(__dirname),
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
      const metadata = analyzeDocument(
        content,
        testConfig,
        'attach/doc1',
        {},
        {}
      )

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
      const metadata = analyzeDocument(
        content,
        testConfig,
        'no-heading.md',
        {},
        {}
      )

      expect(metadata.firstHeading).toBe('no-heading')
    })

    it('should calculate word count correctly', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(
        content,
        testConfig,
        'attach/doc2',
        {},
        {}
      )

      console.log('metadata', metadata)
      // Doc2 has specific number of words (excluding frontmatter)
      expect(metadata.wordCount).toBe(16)
    })
  })

  describe('Document Relationships', () => {
    it('should build relationships using analyzeAllDocuments', () => {
      // Create a test config using absolute path for the attach directory
      const testDirConfig = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['node_modules', '.git', 'dist'],
        includeFiles: ['.md'],
        excludeFiles: [],
        ignoreCase: true
      })

      // Analyze all documents in the test directory
      const { globalMetadata } = analyzeAllDocuments(testDirConfig)

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

    it('should keep valid wiki links and build wiki backlinks', () => {
      const testDirConfig = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['node_modules', '.git', 'dist'],
        includeFiles: ['.md'],
        excludeFiles: [],
        ignoreCase: true
      })

      const { globalMetadata } = analyzeAllDocuments(testDirConfig)

      expect(globalMetadata['links-wiki'].outgoingLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'bananas',
            relativePath: 'bananas',
            type: 'wiki'
          })
        ])
      )
      expect(globalMetadata['bananas'].backLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relativePath: 'links-wiki',
            type: 'wiki'
          })
        ])
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing documents gracefully', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(
        content,
        testConfig,
        'attach/doc2',
        {},
        {}
      )
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

  describe('scanDirectory', () => {
    it('should skip excluded directories', () => {
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}
      const configWithExcludedDirs = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['deep']
      })

      scanDirectory(
        resolve(__dirname, 'attach'),
        configWithExcludedDirs,
        globalMetadata,
        globalPages
      )

      // Files in deep/ should not be scanned
      const deepFiles = Object.keys(globalMetadata).filter((k) =>
        k.startsWith('deep')
      )
      expect(deepFiles).toHaveLength(0)
      // Files at root level should still be scanned
      expect(globalMetadata['doc1']).toBeDefined()
      expect(globalMetadata['doc2']).toBeDefined()
    })

    it('should skip files matching excludeFiles pattern', () => {
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}
      const configWithExcludedFiles = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeFiles: ['doc1']
      })

      scanDirectory(
        resolve(__dirname, 'attach'),
        configWithExcludedFiles,
        globalMetadata,
        globalPages
      )

      expect(globalMetadata['doc1']).toBeUndefined()
      expect(globalMetadata['doc2']).toBeDefined()
    })
  })
})
