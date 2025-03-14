import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  analyzeDocument,
  buildDocumentRelationships
} from '../src/parsers/meta'
import type { PageMetadata } from '../src/types'

/**
 * Helper function to read test files
 * @param filename - Name of the test file
 * @returns Content of the file
 */
const readTestFile = (filename: string): string => {
  const path = resolve(__dirname, 'attach', filename)
  return readFileSync(path, 'utf-8')
}

describe('Document Analyzer', () => {
  describe('Basic Document Analysis', () => {
    it('should analyze document structure', () => {
      const content = readTestFile('doc1.md')
      const metadata = analyzeDocument(content, 'doc1.md')

      console.log('meta', metadata)
      expect(metadata).toMatchObject({
        firstHeading: 'Document 1',
        outgoingLinks: expect.arrayContaining([
          expect.objectContaining({
            text: 'Document 2',
            relativePath: 'doc2.md',
            type: 'markdown'
          }),
          expect.objectContaining({
            text: 'self link',
            relativePath: 'doc1.md',
            type: 'markdown'
          })
        ]),
        wordCount: expect.any(Number),
        lastUpdated: expect.any(Number)
      })
    })

    it('should handle document without headings', () => {
      const content = 'Just some text without any headings'
      const metadata = analyzeDocument(content, 'no-heading.md')

      expect(metadata.firstHeading).toBe('no-heading')
    })

    it('should calculate word count correctly', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(content, 'doc2.md')

      // Doc2 has specific number of words (excluding frontmatter)
      expect(metadata.wordCount).toBe(16)
    })
  })

  describe('Document Relationships', () => {
    it('should build document relationships correctly', () => {
      const doc1Content = readTestFile('doc1.md')
      const doc2Content = readTestFile('doc2.md')

      // Create metadata for both documents
      const metadata: Record<string, PageMetadata> = {
        'doc1.md': analyzeDocument(doc1Content, 'doc1.md'),
        'doc2.md': analyzeDocument(doc2Content, 'doc2.md')
      }

      // Build relationships
      buildDocumentRelationships(metadata)

      // Check doc1's backlinks
      expect(metadata['doc1.md'].backLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relativePath: 'doc2.md',
            type: 'markdown'
          })
        ])
      )

      // Check doc2's backlinks
      expect(metadata['doc2.md'].backLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relativePath: 'doc1.md',
            type: 'markdown'
          })
        ])
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing documents gracefully', () => {
      const content = readTestFile('doc2.md')
      const metadata = analyzeDocument(content, 'doc2.md')

      expect(metadata.outgoingLinks).toContain(
        expect.objectContaining({
          text: 'Missing Document',
          relativePath: 'doc3.md',
          type: 'markdown'
        })
      )
    })
  })
})
