import type { PageMetadata, SitePages } from '../../../types'

/**
 * Public virtual module id imported by client-side consumers.
 */
export const VIRTUAL_MODULE_ID = 'virtual:vitepress-analyzer'

/**
 * Internal Vite id used to distinguish the resolved virtual analyzer module.
 */
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Serializes analyzer state into a virtual module so runtime code can import static metadata.
 *
 * @param siteMetadata - Page metadata collected during the current analysis pass.
 * @param sitePages - Page records collected during the current analysis pass.
 * @returns JavaScript source for the virtual analyzer module.
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
 * Documents the helper surface exposed alongside analyzer virtual-module data.
 */
export interface ClientAPI {
  /** Returns metadata for a path without exposing the backing map shape. */
  getPageMetadata: (path: string) => PageMetadata | undefined
  /** Returns the analyzer map for whole-site views. */
  getAllMetadata: () => Record<string, PageMetadata>
  /** Returns word count with callers deciding how to display missing pages. */
  getPageWordCount: (path: string) => number
  /** Returns headings used by navigational summaries. */
  getPageHeadings: (path: string) => string[]
  /** Returns links from the page to its targets. */
  getPageOutgoingLinks: (path: string) => PageMetadata['outgoingLinks']
  /** Returns links from other pages back to this page. */
  getPageBackLinks: (path: string) => PageMetadata['backLinks']
}
