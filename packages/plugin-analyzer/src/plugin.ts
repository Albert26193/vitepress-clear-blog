import type { Plugin } from 'vite'

import { extractHeading } from './parsers/heading'
import { extractInnerLinks } from './parsers/link'
import { calculateWords } from './parsers/wordCount'
import type { PageLink, PageMetadata } from './types'
import {
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
  generateVirtualModuleContent
} from './virtual/analysis'

/**
 * VitePress analyzer plugin
 * Analyzes markdown files and provides metadata through a virtual module
 */
export function vitePressAnalyzerPlugin(): Plugin {
  // Store analysis results
  const analysisMetadata: Record<string, PageMetadata> = {}

  /**
   * Update backlinks when a new link is found
   * @param sourceFile - The file containing the link
   * @param link - The link information
   */
  const updateBackLinks = (sourceFile: string, link: PageLink) => {
    const targetFile = link.relativePath
    if (!analysisMetadata[targetFile]) {
      // Initialize target file metadata if not exists
      analysisMetadata[targetFile] = {
        wordCount: 0,
        outgoingLinks: [],
        backLinks: [],
        rawContent: '',
        headings: [],
        lastUpdated: Date.now()
      }
    }

    // Add backlink to target file
    analysisMetadata[targetFile].backLinks.push({
      ...link,
      relativePath: sourceFile,
      fullUrl: `/${sourceFile}`
    })
  }

  return {
    name: 'vitepress-analyzer',

    configureServer() {
      // Development server handling can be added here
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return generateVirtualModuleContent(analysisMetadata)
      }
    },

    // VitePress specific hook
    async transform(code: string, id: string) {
      // Only process markdown files
      if (!id.endsWith('.md')) return

      // Extract metadata from file content
      const wordCount = calculateWords(code)
      const outgoingLinks = extractInnerLinks(code, id)
      const headings = extractHeading(code)

      // Update metadata for current file
      analysisMetadata[id] = {
        wordCount,
        outgoingLinks,
        backLinks: analysisMetadata[id]?.backLinks || [], // Preserve existing backlinks
        rawContent: code,
        headings,
        lastUpdated: Date.now()
      }

      // Update backlinks for referenced files
      outgoingLinks.forEach((link) => updateBackLinks(id, link))
    }
  }
}
