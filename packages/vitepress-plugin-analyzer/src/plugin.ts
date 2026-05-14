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
 * Provides build-time Markdown analysis through a Vite virtual module consumed by the theme.
 *
 * @param userConfig - Optional analyzer overrides for docs location and filtering rules.
 * @returns Vite plugin that refreshes site metadata during dev and build.
 */
export function vitePressAnalyzerPlugin(
  userConfig?: Partial<AnalyzerConfig>
): Plugin {
  const config = createConfig(userConfig)

  const siteMetadata: SiteMetadata = {}
  const sitePages: SitePages = {}

  const runAnalysis = async () => {
    const result = await analyzeAllDocuments(config)

    result.match(
      ({ globalMetadata, globalPages }) => {
        Object.assign(siteMetadata, globalMetadata)
        Object.assign(sitePages, globalPages)
      },
      (error) => {
        console.error(
          `[vitepress-analyzer] Unexpected fatal error: ${error.message}`
        )
      }
    )
  }

  return {
    name: 'vitepress-analyzer',

    async configureServer(server) {
      await runAnalysis()
    },

    async buildStart() {
      await runAnalysis()
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
