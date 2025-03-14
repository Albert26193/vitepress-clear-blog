import type { PageMetadata } from '../types'

// Virtual module identifiers
export const VIRTUAL_MODULE_ID = 'virtual:vitepress-analyzer'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Generate virtual module content
 * @param metadata - Page metadata object
 */
export const generateVirtualModuleContent = (
  metadata: Record<string, PageMetadata>
): string => {
  return `
// This file is auto-generated, do not edit manually
// @ts-check

/**
 * @type {Record<string, import('../types/types').PageMetadata>}
 */
const metadata = ${JSON.stringify(metadata, null, 2)}

/**
 * Get metadata for a specific page
 * @param {string} path - Page path
 * @returns {import('../types/types').PageMetadata | undefined}
 */
export const getPageMetadata = (path) => metadata[path]

/**
 * Get metadata for all pages
 * @returns {Record<string, import('../types/types').PageMetadata>}
 */
export const getAllMetadata = () => metadata

/**
 * Get word count for a specific page
 * @param {string} path - Page path
 * @returns {number}
 */
export const getPageWordCount = (path) => metadata[path]?.wordCount ?? 0

/**
 * Get headings for a specific page
 * @param {string} path - Page path
 * @returns {string[]}
 */
export const getPageHeadings = (path) => metadata[path]?.headings ?? []

/**
 * Get outgoing links for a specific page
 * @param {string} path - Page path
 * @returns {import('../types/types').PageLink[]}
 */
export const getPageOutgoingLinks = (path) => metadata[path]?.outgoingLinks ?? []

/**
 * Get backlinks for a specific page
 * @param {string} path - Page path
 * @returns {import('../types/types').PageLink[]}
 */
export const getPageBackLinks = (path) => metadata[path]?.backLinks ?? []
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
