import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { createConfig } from '../src/node/config'
import {
  analyzeAllDocuments,
  analyzeDocument,
  analyzeFile,
  buildDocumentRelationships,
  scanDirectory
} from '../src/node/parsers/analyze'
import type { PageMetadata, SitePages } from '../types'

const tmpRoots: string[] = []

const createTmpRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'analyzer-test-'))
  tmpRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(
    tmpRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  )
})

/** Helper function to read test files
 * @param filename - Name of the test file
 * @returns Content of the file
 */
const readTestFile = async (filename: string): Promise<string> => {
  const path = resolve(__dirname, 'attach', filename)
  return readFile(path, 'utf-8')
}

describe('Document Analyzer', () => {
  describe('Basic Document Analysis', () => {
    it('should analyze document structure', async () => {
      const content = await readTestFile('doc1.md')
      const metadata = analyzeDocument(
        content,
        createConfig({ docsDir: resolve(__dirname) }),
        'attach/doc1',
        {},
        {}
      )

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
        createConfig({ docsDir: resolve(__dirname) }),
        'no-heading.md',
        {},
        {}
      )

      expect(metadata.firstHeading).toBe('no-heading')
    })

    it('should calculate word count correctly', async () => {
      const content = await readTestFile('doc2.md')
      const metadata = analyzeDocument(
        content,
        createConfig({ docsDir: resolve(__dirname) }),
        'attach/doc2',
        {},
        {}
      )

      // Doc2 has specific number of words (excluding frontmatter)
      expect(metadata.wordCount).toBe(16)
    })
  })

  describe('Document Relationships', () => {
    it('should build relationships using analyzeAllDocuments', async () => {
      // Create a test config using absolute path for the attach directory
      const testDirConfig = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['node_modules', '.git', 'dist'],
        includeFiles: ['.md'],
        excludeFiles: [],
        ignoreCase: true
      })

      // Analyze all documents in the test directory
      const { globalMetadata } = (
        await analyzeAllDocuments(testDirConfig)
      )._unsafeUnwrap()

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

    it('should keep valid wiki links and build wiki backlinks', async () => {
      const testDirConfig = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['node_modules', '.git', 'dist'],
        includeFiles: ['.md'],
        excludeFiles: [],
        ignoreCase: true
      })

      const { globalMetadata } = (
        await analyzeAllDocuments(testDirConfig)
      )._unsafeUnwrap()

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
    it('should handle missing documents gracefully', async () => {
      const content = await readTestFile('doc2.md')
      const metadata = analyzeDocument(
        content,
        createConfig({ docsDir: resolve(__dirname) }),
        'attach/doc2',
        {},
        {}
      )
      expect(metadata.outgoingLinks).not.toContain(
        expect.objectContaining({
          text: 'Missing Document',
          relativePath: 'attach/doc3',
          type: 'markdown'
        })
      )
    })
  })

  describe('analyzeFile', () => {
    it('analyzes normal markdown files and updates analyzer maps', async () => {
      const root = await createTmpRoot()
      const filePath = join(root, 'normal.md')
      await writeFile(filePath, '# Normal\n\n[Self](./normal.md)\n\nBody text')
      const config = createConfig({ docsDir: root })
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}

      const result = await analyzeFile(
        filePath,
        config,
        globalMetadata,
        globalPages
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({ firstHeading: 'Normal' })
      expect(globalMetadata.normal).toMatchObject({ firstHeading: 'Normal' })
      expect(globalPages.normal.absolutePath).toBe(join(root, 'normal'))
    })

    it('analyzes empty markdown files with fallback metadata', async () => {
      const root = await createTmpRoot()
      const filePath = join(root, 'empty.md')
      await writeFile(filePath, '')
      const config = createConfig({ docsDir: root })
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}

      const result = await analyzeFile(
        filePath,
        config,
        globalMetadata,
        globalPages
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({
        firstHeading: '',
        outgoingLinks: [],
        wordCount: 0
      })
    })

    it('records diagnostics for unreadable files and keeps scanning alive', async () => {
      const root = await createTmpRoot()
      const filePath = join(root, 'missing.md')
      const config = createConfig({ docsDir: root })

      const result = await analyzeFile(filePath, config, {}, {})

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBeNull()
      expect(config.diagnostics).toEqual([
        expect.stringContaining(`[FILE_READ] ${filePath}:`)
      ])
    })
  })

  describe('buildDocumentRelationships', () => {
    it('rebuilds backlinks without depending on scan order', () => {
      const globalMetadata: Record<string, PageMetadata> = {
        source: {
          firstHeading: 'Source',
          outgoingLinks: [
            {
              text: 'Target',
              relativePath: 'target',
              absolutePath: '/docs/target.md',
              fullUrl: '/target',
              raw: '[Target](./target.md)',
              type: 'markdown'
            }
          ],
          backLinks: [
            {
              text: 'Stale',
              relativePath: 'stale',
              absolutePath: '/docs/stale.md',
              fullUrl: '/stale',
              raw: '[Stale](./stale.md)',
              type: 'markdown'
            }
          ],
          wordCount: 1,
          lastUpdated: 1
        },
        target: {
          firstHeading: 'Target',
          outgoingLinks: [],
          backLinks: [],
          wordCount: 1,
          lastUpdated: 1
        }
      }

      buildDocumentRelationships(globalMetadata)

      expect(globalMetadata.source.backLinks).toEqual([])
      expect(globalMetadata.target.backLinks).toEqual([
        expect.objectContaining({
          text: 'Target',
          relativePath: 'source',
          fullUrl: '/source',
          type: 'markdown'
        })
      ])
    })
  })

  describe('scanDirectory', () => {
    it('recursively scans nested markdown files and ignores non-markdown files', async () => {
      const root = await createTmpRoot()
      const nestedDir = join(root, 'nested')
      await writeFile(join(root, 'root.md'), '# Root')
      await writeFile(join(root, 'notes.txt'), '# Not Markdown')
      await mkdir(nestedDir)
      await writeFile(join(nestedDir, 'child.md'), '# Child')
      const config = createConfig({ docsDir: root })
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}

      const result = await scanDirectory(
        root,
        config,
        globalMetadata,
        globalPages
      )

      if (result.isErr()) throw result.error
      expect(globalMetadata.root).toBeDefined()
      expect(globalMetadata['nested/child']).toBeDefined()
      expect(globalMetadata['notes.txt']).toBeUndefined()
      expect(globalPages['nested/child'].relativePath).toBe('nested/child')
    })

    it('records diagnostics for nonexistent directories', async () => {
      const root = await createTmpRoot()
      const missingDir = join(root, 'missing')
      const config = createConfig({ docsDir: root })

      const result = await scanDirectory(missingDir, config, {}, {})

      expect(result.isOk()).toBe(true)
      expect(config.diagnostics).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`[DIR_READ] ${missingDir}:`)
        ])
      )
    })

    it('should skip excluded directories', async () => {
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}
      const configWithExcludedDirs = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeDirs: ['deep']
      })

      const result = await scanDirectory(
        resolve(__dirname, 'attach'),
        configWithExcludedDirs,
        globalMetadata,
        globalPages
      )
      if (result.isErr()) throw result.error

      const deepFiles = Object.keys(globalMetadata).filter((k) =>
        k.startsWith('deep')
      )
      expect(deepFiles).toHaveLength(0)
      expect(globalMetadata['doc1']).toBeDefined()
      expect(globalMetadata['doc2']).toBeDefined()
    })

    it('should skip files matching excludeFiles pattern', async () => {
      const globalMetadata: Record<string, PageMetadata> = {}
      const globalPages: SitePages = {}
      const configWithExcludedFiles = createConfig({
        docsDir: resolve(__dirname, 'attach'),
        excludeFiles: ['doc1']
      })

      const result2 = await scanDirectory(
        resolve(__dirname, 'attach'),
        configWithExcludedFiles,
        globalMetadata,
        globalPages
      )
      if (result2.isErr()) throw result2.error

      expect(globalMetadata['doc1']).toBeUndefined()
      expect(globalMetadata['doc2']).toBeDefined()
    })
  })
})
