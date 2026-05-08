import type { PageLink, PageMetadata } from '../../types'

/**
 * Reads metadata for one page from the analyzer payload without forcing callers to know the storage shape.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @param path - Page path used by the virtual analyzer module.
 * @returns Metadata for the requested page, or undefined when the page was not analyzed.
 */
export function getPageMetadata(
  metadata: Record<string, PageMetadata>,
  path: string
): PageMetadata | undefined {
  return metadata[path]
}

/**
 * Exposes the full analyzer payload for views that need to derive cross-page data.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @returns The original metadata map.
 */
export function getAllMetadata(
  metadata: Record<string, PageMetadata>
): Record<string, PageMetadata> {
  return metadata
}

/**
 * Provides a safe word-count lookup for optional page metadata.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @param path - Page path used by the virtual analyzer module.
 * @returns Word count for the requested page, or zero when unavailable.
 */
export function getPageWordCount(
  metadata: Record<string, PageMetadata>,
  path: string
): number {
  return metadata[path]?.wordCount ?? 0
}

/**
 * Provides the analyzer heading used by page summaries and graph labels.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @param path - Page path used by the virtual analyzer module.
 * @returns First heading for the requested page, or undefined when unavailable.
 */
export function getPageFirstHeading(
  metadata: Record<string, PageMetadata>,
  path: string
): string | undefined {
  return metadata[path]?.firstHeading
}

/**
 * Provides outgoing links with an empty-array fallback for simpler rendering code.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @param path - Page path used by the virtual analyzer module.
 * @returns Outgoing links for the requested page.
 */
export function getPageOutgoingLinks(
  metadata: Record<string, PageMetadata>,
  path: string
): PageLink[] {
  return metadata[path]?.outgoingLinks ?? []
}

/**
 * Provides backlinks with an empty-array fallback for simpler rendering code.
 *
 * @param metadata - Analyzer metadata keyed by page path.
 * @param path - Page path used by the virtual analyzer module.
 * @returns Backlinks for the requested page.
 */
export function getPageBackLinks(
  metadata: Record<string, PageMetadata>,
  path: string
): PageLink[] {
  return metadata[path]?.backLinks ?? []
}
