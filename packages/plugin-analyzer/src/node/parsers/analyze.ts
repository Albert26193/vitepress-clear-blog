import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import type { AnalyzerConfig, PageMetadata } from '../../../types'
import { calculateWords } from '../utils/wordCount'
import { extractHeading } from './heading'
import { extractInnerLinks } from './link'

/**
 * Analyze a single document and extract its metadata
 * Note: Frontmatter will be handled by VitePress's markdown transformer
 *
 * @param content - Raw markdown content
 * @param config - The analyzer configuration
 * @param filePath - Path to the document relative to docs root
 * @param globalMetadata - Optional global metadata map to update backlinks
 * @returns Document metadata
 */
export const analyzeDocument = (
  content: string,
  config: AnalyzerConfig,
  filePath: string,
  globalMetadata?: Record<string, PageMetadata>
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

  return metadata
}

/**
 * Analyze a markdown file and extract its metadata
 *
 * @param filePath - Absolute path to the markdown file
 * @param config - The analyzer configuration
 * @param globalMetadata - Global metadata map to update
 * @returns The metadata for the analyzed file
 */
export const analyzeFile = (
  filePath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>
): PageMetadata => {
  // Read the file content
  const content = readFileSync(filePath, 'utf-8')

  // Get the path relative to the docs directory
  const docsRoot = resolve(process.cwd(), config.docsDir)
  const relativePath = relative(docsRoot, filePath).replace(/\.md$/, '')

  // Analyze the document and update global metadata
  return analyzeDocument(content, config, relativePath, globalMetadata)
}

/**
 * Scan a directory recursively and analyze all markdown files
 *
 * @param dirPath - Path to the directory to scan
 * @param config - The analyzer configuration
 * @param globalMetadata - Global metadata map to update
 */
export const scanDirectory = (
  dirPath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>
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
      scanDirectory(fullPath, config, globalMetadata)
    } else if (file.endsWith('.md')) {
      // Skip excluded files
      if (config.excludeFiles.some((pattern) => file.includes(pattern))) {
        return
      }

      // Analyze markdown files
      analyzeFile(fullPath, config, globalMetadata)
    }
  })
}

/**
 * Build relationships between documents (e.g., backlinks)
 * This should be called after all documents have been analyzed
 *
 * @param globalMetadata - Map of document paths to their metadata
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
          fullUrl: `/${sourcePath}`
        })
      }
    })
  })
}

/**
 * Analyze all documents in a directory and build relationships
 *
 * @param config - The analyzer configuration
 * @returns Global metadata map with all document relationships
 */
export const analyzeAllDocuments = (
  config: AnalyzerConfig
): Record<string, PageMetadata> => {
  // Initialize global metadata map
  const globalMetadata: Record<string, PageMetadata> = {}

  // Get the docs root directory
  const docsRoot = resolve(process.cwd(), config.docsDir)

  // Scan the docs directory and analyze all markdown files
  scanDirectory(docsRoot, config, globalMetadata)

  // Build document relationships
  buildDocumentRelationships(globalMetadata)

  return globalMetadata
}
