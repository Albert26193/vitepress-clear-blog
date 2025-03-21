import type { PageLink, PageMetadata } from '../../types'

/**
 * Get metadata for a specific page
 */
export function getPageMetadata(
  metadata: Record<string, PageMetadata>,
  path: string
): PageMetadata | undefined {
  return metadata[path]
}

/**
 * Get metadata for all pages
 */
export function getAllMetadata(
  metadata: Record<string, PageMetadata>
): Record<string, PageMetadata> {
  return metadata
}

/**
 * Get word count for a specific page
 */
export function getPageWordCount(
  metadata: Record<string, PageMetadata>,
  path: string
): number {
  return metadata[path]?.wordCount ?? 0
}

/**
 * Get headings for a specific page
 */
export function getPageFirstHeading(
  metadata: Record<string, PageMetadata>,
  path: string
): string | undefined {
  return metadata[path]?.firstHeading
}

/**
 * Get outgoing links for a specific page
 */
export function getPageOutgoingLinks(
  metadata: Record<string, PageMetadata>,
  path: string
): PageLink[] {
  return metadata[path]?.outgoingLinks ?? []
}

/**
 * Get backlinks for a specific page
 */
export function getPageBackLinks(
  metadata: Record<string, PageMetadata>,
  path: string
): PageLink[] {
  return metadata[path]?.backLinks ?? []
}
