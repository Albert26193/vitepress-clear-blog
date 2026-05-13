import type { PageMetadata } from './page'

/**
 * Documents the client helper surface exposed alongside analyzer virtual-module data.
 * Consumers can import this type for type-safe access to analyzer client APIs.
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
