import type { PageMetadata, SitePages } from '../../../types'

// Virtual module identifiers
export const VIRTUAL_MODULE_ID = 'virtual:vitepress-analyzer'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Generate virtual module content
 * @param siteMetaData - Page metadata object
 */
export const generateVirtualModuleContent = (
  siteMetadata: Record<string, PageMetadata>,
  sitePages: SitePages
): string => {
  return `
// This file is auto-generated, do not edit manually
// @ts-check

/**
 * @type {Record<string, import('../types/types').PageMetadata>}
 */
export const siteMetadata = ${JSON.stringify(siteMetadata, null, 2)}

/**
 * @type SitePages
 */
export const sitePages = ${JSON.stringify(sitePages, null, 2)}
`
}

/**
 * Client API interface for the virtual module
 */
export interface ClientAPI {
  /** Get metadata for a specific page */
  getPageMetadata: (path: string) => PageMetadata | undefined
  /** Get metadata for all pages */
  getAllMetadata: () => Record<string, PageMetadata>
  /** Get word count for a specific page */
  getPageWordCount: (path: string) => number
  /** Get headings for a specific page */
  getPageHeadings: (path: string) => string[]
  /** Get outgoing links for a specific page */
  getPageOutgoingLinks: (path: string) => PageMetadata['outgoingLinks']
  /** Get backlinks for a specific page */
  getPageBackLinks: (path: string) => PageMetadata['backLinks']
}
