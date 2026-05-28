import { ResultAsync, ok, okAsync } from 'neverthrow'
import { relative, resolve } from 'node:path'

import type {
  AnalyzerConfig,
  Page,
  PageMetadata,
  SitePages
} from '../../../types'
import { logger } from '../utils/logger'
import { buildFilenameIndex, diagnoseIndexWarning } from '../utils/path'
import { type AnalyzerError, safeReadFile, safeReaddir } from '../utils/safeIO'
import { calculateWords } from '../utils/wordCount'
import { extractHeading } from './heading'
import { extractInnerLinks } from './link'

export type AnalysisResult = {
  globalMetadata: Record<string, PageMetadata>
  globalPages: SitePages
}

/**
 * Extracts metadata from one Markdown document and updates shared analyzer maps in the same pass.
 */
export const analyzeDocument = (
  content: string,
  config: AnalyzerConfig,
  filePath: string,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): PageMetadata => {
  const headings = extractHeading(content)
  const outgoingLinks = extractInnerLinks(content, config, filePath)
  const wordCount = calculateWords(content)

  const metadata: PageMetadata = {
    firstHeading: headings[0] || '',
    outgoingLinks,
    backLinks: [],
    wordCount,
    lastUpdated: Date.now()
  }

  if (globalMetadata) {
    outgoingLinks.forEach((link) => {
      const targetPath = link.relativePath
      if (globalMetadata[targetPath]) {
        const sourceTitle =
          metadata.firstHeading && metadata.firstHeading !== 'no-heading'
            ? metadata.firstHeading
            : filePath.split('/').pop() || filePath
        globalMetadata[targetPath].backLinks.push({
          ...link,
          relativePath: filePath,
          fullUrl: `/${filePath}`,
          text: sourceTitle
        })
      }
    })
    globalMetadata[filePath] = metadata
  }

  const currentPageInfo: Page = {
    absolutePath: resolve(config.docsDir, filePath),
    relativePath: filePath,
    metadata
  }
  globalPages[filePath] = currentPageInfo

  logger.debug('Analyzed document', {
    filePath,
    outgoingLinks: outgoingLinks.length,
    wordCount
  })

  return metadata
}

/**
 * Reads one Markdown file; read errors are absorbed into diagnostics so the
 * analysis continues with the remaining files.
 */
export const analyzeFile = (
  filePath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): ResultAsync<PageMetadata | null, AnalyzerError> => {
  const docsRoot = resolve(process.cwd(), config.docsDir)
  const relativePath = relative(docsRoot, filePath).replace(/\.md$/, '')

  return safeReadFile(filePath)
    .map((content) =>
      analyzeDocument(
        content,
        config,
        relativePath,
        globalMetadata,
        globalPages
      )
    )
    .orElse((error) => {
      config.diagnostics.push(`[${error.type}] ${error.path}: ${error.message}`)
      return ok(null)
    })
}

/**
 * Walks a directory tree recursively. Individual file and subdirectory failures
 * are logged and skipped so the scan continues.
 */
export const scanDirectory = (
  dirPath: string,
  config: AnalyzerConfig,
  globalMetadata: Record<string, PageMetadata>,
  globalPages: SitePages
): ResultAsync<void, AnalyzerError> => {
  logger.info('Starting directory scan', { dirPath })

  return safeReaddir(dirPath)
    .andThen((entries) => {
      const tasks = entries.map((entry): ResultAsync<void, AnalyzerError> => {
        if (config.excludeDirs.includes(entry.name)) {
          logger.debug('Skipping excluded directory', {
            name: entry.name,
            dirPath
          })
          return okAsync(undefined)
        }

        const fullPath = resolve(dirPath, entry.name)

        if (entry.isDirectory()) {
          return scanDirectory(fullPath, config, globalMetadata, globalPages)
        }

        if (entry.name.endsWith('.md')) {
          if (config.excludeFiles.some((p) => entry.name.includes(p))) {
            logger.debug('Skipping excluded file', {
              name: entry.name,
              dirPath
            })
            return okAsync(undefined)
          }
          return analyzeFile(fullPath, config, globalMetadata, globalPages).map(
            () => undefined
          )
        }

        return okAsync(undefined)
      })

      return ResultAsync.combine(tasks).map(() => {
        logger.info('Completed directory scan', {
          dirPath,
          documents: Object.keys(globalMetadata).length
        })
      })
    })
    .orElse((error) => {
      config.diagnostics.push(`[${error.type}] ${error.path}: ${error.message}`)
      return ok(undefined)
    })
}

/**
 * Rebuilds backlinks after all documents are known so relationships are not order-dependent.
 */
export const buildDocumentRelationships = (
  globalMetadata: Record<string, PageMetadata>
): void => {
  Object.values(globalMetadata).forEach((doc) => {
    doc.backLinks = []
  })

  Object.entries(globalMetadata).forEach(([sourcePath, doc]) => {
    doc.outgoingLinks.forEach((link) => {
      const targetPath = link.relativePath
      if (globalMetadata[targetPath]) {
        const sourceTitle =
          doc.firstHeading && doc.firstHeading !== 'no-heading'
            ? doc.firstHeading
            : sourcePath.split('/').pop() || sourcePath
        globalMetadata[targetPath].backLinks.push({
          ...link,
          relativePath: sourcePath,
          fullUrl: `/${sourcePath}`.replace(/\/+/g, '/'),
          text: sourceTitle
        })
      }
    })
  })
}

/**
 * Produces whole-site metadata. IO failures during analysis are collected in
 * config.diagnostics and never cause the build to abort.
 */
export const analyzeAllDocuments = (
  config: AnalyzerConfig
): ResultAsync<AnalysisResult, AnalyzerError> => {
  const globalMetadata: Record<string, PageMetadata> = {}
  const globalPages: SitePages = {}
  const docsRoot = resolve(process.cwd(), config.docsDir)

  config.diagnostics = []

  return buildFilenameIndex(docsRoot, config)
    .andThen((filenameIndex) => {
      config.filenameIndex = filenameIndex
      diagnoseIndexWarning(config)
      return scanDirectory(docsRoot, config, globalMetadata, globalPages)
    })
    .map(() => {
      buildDocumentRelationships(globalMetadata)

      if (config.diagnostics.length > 0) {
        logger.warn(`Issues:\n${config.diagnostics.join('\n')}`)
      }

      return { globalMetadata, globalPages }
    })
    .orElse((error) => {
      logger.error(`Fatal: ${error.path}: ${error.message}`)
      return ok({ globalMetadata, globalPages })
    })
}
