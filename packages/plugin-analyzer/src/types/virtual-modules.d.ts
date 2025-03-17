import type { PageLink, PageMetadata, SiteMetadata } from './page'

declare module 'virtual:vitepress-analyzer' {
  export const globalMdMetadata: SiteMetadata

  /**
   * Get metadata for a specific page
   * @param path - Page path
   * @returns Page metadata or undefined if not found
   */
  export function getPageMetadata(path: string): PageMetadata | undefined

  /**
   * Get metadata for all pages
   * @returns Record of all page metadata
   */
  export function getAllMetadata(): Record<string, PageMetadata>

  /**
   * Get word count for a specific page
   * @param path - Page path
   * @returns Word count
   */
  export function getPageWordCount(path: string): number

  /**
   * Get headings for a specific page
   * @param path - Page path
   * @returns Array of headings
   */
  export function getPageHeadings(path: string): string[]

  /**
   * Get outgoing links for a specific page
   * @param path - Page path
   * @returns Array of outgoing links
   */
  export function getPageOutgoingLinks(path: string): PageLink[]

  /**
   * Get backlinks for a specific page
   * @param path - Page path
   * @returns Array of backlinks
   */
  export function getPageBackLinks(path: string): PageLink[]
}
