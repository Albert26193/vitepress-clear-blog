import { resolve } from 'node:path'
import type { Plugin } from 'vite'

import type { SiteMetadata, SitePages } from '../types'
import type { AnalyzerConfig } from '../types'
import { createConfig } from './node/config'
import { analyzeAllDocuments } from './node/parsers/analyze'
import {
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
  generateVirtualModuleContent
} from './node/virtual'

/**
 * VitePress analyzer plugin
 * Analyzes markdown files and provides metadata through a virtual module
 *
 * @param userConfig - Optional user configuration
 * @returns VitePress plugin
 */
export function vitePressAnalyzerPlugin(
  userConfig?: Partial<AnalyzerConfig>
): Plugin {
  // Create configuration
  const config = createConfig(userConfig)

  // Store analysis results
  const siteMetadata: SiteMetadata = {}
  const sitePages: SitePages = {}

  // Run analyzeAllDocuments
  const runAnalysis = () => {
    // Get the docs root directory
    // console.log('[Analyzer Plugin] Initializing...')
    // const docsRoot = resolve(process.cwd(), config.docsDir)
    // console.log('[Analyzer Plugin] Docs root:', docsRoot)

    // Initial scan of all documents
    const { globalMetadata, globalPages } = analyzeAllDocuments(config)

    // Store metadata
    Object.assign(siteMetadata, globalMetadata)
    Object.assign(sitePages, globalPages)
  }

  return {
    name: 'vitepress-analyzer',

    configureServer(server) {
      runAnalysis()
    },

    buildStart() {
      runAnalysis()
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return generateVirtualModuleContent(siteMetadata, sitePages)
      }
    }
  }
}
