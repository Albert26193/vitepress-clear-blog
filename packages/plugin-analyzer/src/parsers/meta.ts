import type { PageLink, PageMetadata } from '../types'
import { extractHeading } from './heading'
import { extractInnerLinks } from './link'
import { calculateWords } from './wordCount'

/**
 * Analyze a single document and extract its metadata
 * Note: Frontmatter will be handled by VitePress's markdown transformer
 *
 * @param content - Raw markdown content
 * @param filePath - Path to the document
 * @returns Document metadata
 */
export const analyzeDocument = (
  content: string,
  filePath: string
): PageMetadata => {
  // Extract document structure and relationships
  const headings = extractHeading(content)
  const outgoingLinks = extractInnerLinks(content, filePath)
  const wordCount = calculateWords(content)

  // Determine document title from first heading or filename
  const title = headings[0] || filePath

  return {
    firstHeading: headings[0] || '', // Get first heading or empty string
    outgoingLinks,
    backLinks: [], // Will be populated by buildDocumentRelationships
    wordCount,
    rawContent: '',
    lastUpdated: Date.now()
  }
}

/**
 * Build relationships between documents (e.g., backlinks)
 * This should be called after all documents have been analyzed
 *
 * @param metadata - Map of document paths to their metadata
 */
export const buildDocumentRelationships = (
  metadata: Record<string, PageMetadata>
): void => {
  // Reset all backlinks
  Object.values(metadata).forEach((doc) => {
    doc.backLinks = []
  })

  // Build new backlinks
  Object.entries(metadata).forEach(([sourcePath, doc]) => {
    doc.outgoingLinks.forEach((link) => {
      const targetPath = link.relativePath
      // Only build relationships for internal links
      if (metadata[targetPath]) {
        metadata[targetPath].backLinks.push({
          ...link,
          relativePath: sourcePath,
          fullUrl: `/${sourcePath}`
        })
      }
    })
  })
}

/**
 * Find backlinks for a specific file
 * @param targetFile - The file to find backlinks for
 * @param allFiles - Map of all files and their content
 * @returns Array of backlinks
 */
export const findBackLinks = (
  targetFile: string,
  allFiles: Map<string, string>
): PageLink[] => {
  const backlinks: PageLink[] = []

  // Iterate through all files to find links to the target file
  allFiles.forEach((content, sourceFile) => {
    if (sourceFile === targetFile) return // Skip self-references

    const outgoingLinks = extractInnerLinks(content, sourceFile)

    // Find links that point to the target file
    outgoingLinks.forEach((link) => {
      if (link.relativePath === targetFile) {
        backlinks.push({
          ...link,
          relativePath: sourceFile,
          fullUrl: `/${sourceFile}`
        })
      }
    })
  })

  return backlinks
}
