import type { Plugin } from 'vite'

import type { SiteMetadata, SitePages } from '../types'
import type { AnalyzerConfig } from '../types'
import { createConfig } from './node/config'
import { analyzeAllDocuments } from './node/parsers/analyze'
import { logger, setAnalyzerLogLevel } from './node/utils/logger'
import { getDocsRoot } from './node/utils/path'
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
  setAnalyzerLogLevel(config.logLevel)

  const siteMetadata: SiteMetadata = {}
  const sitePages: SitePages = {}

  let cachedModuleContent: string | null = null

  const runAnalysis = async () => {
    cachedModuleContent = null
    logger.info('Starting site analysis', { docsDir: config.docsDir })
    const startedAt = Date.now()
    const result = await analyzeAllDocuments(config)

    result.match(
      ({ globalMetadata, globalPages }) => {
        Object.assign(siteMetadata, globalMetadata)
        Object.assign(sitePages, globalPages)
        cachedModuleContent = generateVirtualModuleContent(
          siteMetadata,
          sitePages
        )
        logger.info('Completed site analysis', {
          documents: Object.keys(globalMetadata).length,
          pages: Object.keys(globalPages).length,
          durationMs: Date.now() - startedAt
        })
      },
      (error) => {
        logger.error(`Unexpected fatal error: ${error.message}`)
      }
    )
  }

  return {
    name: 'vitepress-analyzer',

    async configureServer(server) {
      await runAnalysis()

      const docsRoot = getDocsRoot(config)
      server.watcher.on('all', (_event, path) => {
        if (path.startsWith(docsRoot) && path.endsWith('.md')) {
          logger.debug('File change detected, re-running analysis', { path })
          runAnalysis()
        }
      })
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
        const content =
          cachedModuleContent ??
          generateVirtualModuleContent(siteMetadata, sitePages)
        logger.debug('Loading analyzer virtual module', {
          documents: Object.keys(siteMetadata).length,
          pages: Object.keys(sitePages).length,
          cached: cachedModuleContent !== null
        })
        return content
      }
    }
  }
}
