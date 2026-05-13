import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import type {
  AnalyzerConfig,
  Page,
  PageMetadata,
  SitePages
} from '../../../types'
import { buildFilenameIndex } from '../utils/path'
import { calculateWords } from '../utils/wordCount'
import { extractHeading } from './heading'
import { extractInnerLinks } from './link'

/**
 * Extracts metadata from one Markdown document and updates shared analyzer maps in the same pass.
 *
 * @param content - Raw Markdown content.
 * @param config - Analyzer configuration for path and link resolution.
 * @param filePath - Document path relative to the docs root.
 * @param globalMetadata - Metadata map receiving this page and backlink updates.
 * @param globalPages - Page map receiving this page record.
 * @returns Metadata for the analyzed document.
 */
export const analyzeDocument = (
  content: string,
  config: AnalyzerConfig,
  filePath: string,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): PageMetadata => {
  // Extract document structure and relationships
  const headings = extractHeading(content)
  const outgoingLinks = extractInnerLinks(content, config, filePath)
  const wordCount = calculateWords(content)

  // Create the metadata for this document
  const metadata: PageMetadata = {
    firstHeading: headings[0] || '', // Get first heading or empty string
    outgoingLinks,
    backLinks: [],
    wordCount,
    lastUpdated: Date.now()
  }

  // If we have global metadata, update backlinks for target documents
  if (globalMetadata) {
    outgoingLinks.forEach((link) => {
      const targetPath = link.relativePath

      // If the target document exists in our collection
      if (globalMetadata[targetPath]) {
        // Add this document as a backlink to the target document
        globalMetadata[targetPath].backLinks.push({
          ...link,
          relativePath: filePath,
          fullUrl: `/${filePath}`
        })
      }
    })

    // Add this document's metadata to the global collection
    globalMetadata[filePath] = metadata
  }

  // Add pages info into globalPages map
  const currentPageInfo: Page = {
    absolutePath: resolve(config.docsDir, filePath),
    relativePath: filePath,
    metadata
  }

  globalPages[filePath] = currentPageInfo

  return metadata
}

/**
 * Reads one Markdown file from disk and analyzes it using its docs-root-relative path.
 *
 * @param filePath - Absolute path to the Markdown file.
 * @param config - Analyzer configuration for docs root and filtering.
 * @param globalMetadata - Metadata map receiving this page and backlink updates.
 * @param globalPages - Page map receiving this page record.
 * @returns Metadata for the analyzed file.
 */
export const analyzeFile = async (
  filePath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): Promise<PageMetadata> => {
  const content = await readFile(filePath, 'utf-8')

  const docsRoot = resolve(process.cwd(), config.docsDir)
  const relativePath = relative(docsRoot, filePath).replace(/\.md$/, '')

  return analyzeDocument(
    content,
    config,
    relativePath,
    globalMetadata,
    globalPages
  )
}

/**
 * Walks a docs directory so analyzer metadata covers every included Markdown page.
 *
 * @param dirPath - Directory to scan recursively.
 * @param config - Analyzer configuration for directory and file filtering.
 * @param globalMetadata - Metadata map receiving analyzed pages.
 * @param globalPages - Page map receiving analyzed page records.
 * @returns Nothing; results are written into the provided maps.
 */
export const scanDirectory = async (
  dirPath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): Promise<void> => {
  const entries = await readdir(dirPath, { withFileTypes: true })

  const tasks = entries.map(async (entry) => {
    if (config.excludeDirs.includes(entry.name)) {
      return
    }

    const fullPath = resolve(dirPath, entry.name)

    if (entry.isDirectory()) {
      await scanDirectory(fullPath, config, globalMetadata, globalPages)
    } else if (entry.name.endsWith('.md')) {
      if (config.excludeFiles.some((pattern) => entry.name.includes(pattern))) {
        return
      }

      await analyzeFile(fullPath, config, globalMetadata, globalPages)
    }
  })

  await Promise.all(tasks)
}

/**
 * Rebuilds backlinks after all documents are known so relationships are not order-dependent.
 *
 * @param globalMetadata - Metadata map whose backlinks should mirror outgoing links.
 * @returns Nothing; backlinks are rewritten in place.
 */
export const buildDocumentRelationships = (
  globalMetadata: Record<string, PageMetadata>
): void => {
  // Reset all backlinks
  Object.values(globalMetadata).forEach((doc) => {
    doc.backLinks = []
  })

  // Build new backlinks
  Object.entries(globalMetadata).forEach(([sourcePath, doc]) => {
    doc.outgoingLinks.forEach((link) => {
      const targetPath = link.relativePath
      // Only build relationships for internal links
      if (globalMetadata[targetPath]) {
        globalMetadata[targetPath].backLinks.push({
          ...link,
          relativePath: sourcePath,
          fullUrl: `/${sourcePath}`.replace(/\/+/g, '/')
        })
      }
    })
  })
}

/**
 * Produces whole-site metadata used by the virtual module and graph components.
 *
 * @param config - Analyzer configuration for docs root and filtering rules.
 * @returns Analyzer metadata and page records for the complete docs tree.
 */
export const analyzeAllDocuments = async (
  config: AnalyzerConfig
): Promise<{
  globalMetadata: Record<string, PageMetadata>
  globalPages: SitePages
}> => {
  const globalMetadata: Record<string, PageMetadata> = {}
  const globalPages: SitePages = {}

  const docsRoot = resolve(process.cwd(), config.docsDir)

  // Build filename index for obsidianShortest path resolution
  config.filenameIndex = await buildFilenameIndex(docsRoot, config)
  config.diagnostics = []

  await scanDirectory(docsRoot, config, globalMetadata, globalPages)

  buildDocumentRelationships(globalMetadata)

  // Log diagnostics after analysis
  if (config.diagnostics.length > 0) {
    console.warn(
      `[vitepress-analyzer] Link resolution warnings:\n${config.diagnostics.join('\n')}`
    )
  }

  return { globalMetadata, globalPages }
}
