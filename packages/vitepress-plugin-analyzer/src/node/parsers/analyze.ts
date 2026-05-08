import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import type {
  AnalyzerConfig,
  Page,
  PageMetadata,
  SitePages
} from '../../../types'
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
export const analyzeFile = (
  filePath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): PageMetadata => {
  // Read the file content
  const content = readFileSync(filePath, 'utf-8')

  // Get the path relative to the docs directory
  const docsRoot = resolve(process.cwd(), config.docsDir)
  const relativePath = relative(docsRoot, filePath).replace(/\.md$/, '')

  // Analyze the document and update global metadata
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
export const scanDirectory = (
  dirPath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): void => {
  // Get the list of files in the directory
  const files = readdirSync(dirPath)

  // Process each file
  files.forEach((file) => {
    // Skip excluded directories
    if (config.excludeDirs.includes(file)) {
      return
    }

    const fullPath = resolve(dirPath, file)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(fullPath, config, globalMetadata, globalPages)
    } else if (file.endsWith('.md')) {
      // Skip excluded files
      if (config.excludeFiles.some((pattern) => file.includes(pattern))) {
        return
      }

      // Analyze markdown files
      analyzeFile(fullPath, config, globalMetadata, globalPages)
    }
  })
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
export const analyzeAllDocuments = (
  config: AnalyzerConfig
): { globalMetadata: Record<string, PageMetadata>; globalPages: SitePages } => {
  // Initialize global metadata map
  const globalMetadata: Record<string, PageMetadata> = {}
  const globalPages: SitePages = {}

  // Get the docs root directory
  const docsRoot = resolve(process.cwd(), config.docsDir)

  // Scan the docs directory and analyze all markdown files
  scanDirectory(docsRoot, config, globalMetadata, globalPages)

  // Build document relationships
  buildDocumentRelationships(globalMetadata)

  return { globalMetadata, globalPages }
}
