import MarkdownIt from 'markdown-it'
import markdownItWikilinks from 'markdown-it-wikilinks'
import type Token from 'markdown-it/lib/token.mjs'
import { relative, resolve } from 'node:path'

import type { AnalyzerConfig, PageLink } from '../../../types'
import { getDocsRoot, normalizeLink, resolveLinkMultiMode } from '../utils/path'

// Initialize markdown-it instance with wikilink support
const md = new MarkdownIt({
  linkify: true,
  html: true
})
md.use(
  markdownItWikilinks({
    baseURL: '/',
    uriSuffix: '',
    makeAllLinksAbsolute: true,
    postProcessPagePath: (pagePath: string) => pagePath.trim(),
    postProcessLabel: (label: string) => label.trim()
  })
)

/**
 * Check if a link is an external link
 *
 * @param link - The link to validate
 * @returns True if the link is external, false otherwise
 */
const isExternalLink = (link: string): boolean =>
  link.startsWith('http') ||
  link.startsWith('https') ||
  link.startsWith('#') ||
  link.startsWith('mailto:') ||
  link.startsWith('tel:') ||
  link.startsWith('mailto:') ||
  link.startsWith('tel:')

/**
 * Create a link validation function.
 */
const createValidateLink =
  (config: AnalyzerConfig, currentFile: string) =>
  (link: string): boolean => {
    if (isExternalLink(link)) {
      return false
    }

    const normalizedLink = normalizeLink(link)

    if (!normalizedLink) {
      return false
    }

    // Use multi-mode resolution — the first mode that finds the file wins
    return resolveLinkMultiMode(normalizedLink, config, currentFile) !== null
  }

/**
 * Extract standard Markdown links from tokens, be like:
 *  [link](./link.md) or [link](./link)
 *
 * @param tokens - The Markdown tokens array
 * @param validateLink - The link validation function
 * @returns The extracted links array
 */
const extractMarkdownLinks = (
  tokens: Token[],
  validateLink: (link: string) => boolean
): Partial<PageLink>[] => {
  const links: Partial<PageLink>[] = []

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      let currentLink: Partial<PageLink> | null = null

      token.children.forEach((child, index) => {
        if (child.type === 'link_open') {
          const rawHref = child.attrGet('href')
          if (rawHref) {
            const href = decodeURIComponent(rawHref)
            if (validateLink(href)) {
              currentLink = {
                relativePath: href,
                type: 'markdown',
                raw: ''
              }
            }
          }
        }

        if (child.type.startsWith('regexp-')) {
          const match = (child.meta as { match: RegExpExecArray } | undefined)
            ?.match
          if (match) {
            const pagePath = match[1]
            const label = match[3] || match[1]
            if (validateLink(pagePath)) {
              links.push({
                text: label.trim(),
                relativePath: pagePath.trim(),
                type: 'wiki',
                raw: match[0]
              })
            }
          }
        }

        if (
          currentLink &&
          child.type === 'text' &&
          token?.children?.[index - 1]?.type === 'link_open'
        ) {
          currentLink.text = child.content || ''
          currentLink.raw = `[${child.content}](${currentLink.relativePath})`
          links.push(currentLink)
          currentLink = null
        }
      })
    }
  })

  return links
}

/**
 * Extract HTML links from tokens, be like:
 * <a href="./link.md">link</a> or <a href="./link">link</a>
 *
 * @param tokens - The Markdown tokens array
 * @param validateLink - The link validation function
 * @returns The extracted links array
 */
const extractHtmlLinks = (
  tokens: Token[],
  validateLink: (link: string) => boolean
): Partial<PageLink>[] => {
  const links: Partial<PageLink>[] = []

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      let currentLink: Partial<PageLink> | null = null

      token.children.forEach((child, index) => {
        // Handle HTML <a> tags
        if (child.type === 'html_inline' && child.content.startsWith('<a ')) {
          const hrefMatch = child.content.match(/href="([^"]*)"/)
          if (hrefMatch && hrefMatch[1] && validateLink(hrefMatch[1])) {
            currentLink = {
              relativePath: hrefMatch[1],
              type: 'html',
              raw: child.content
            }
          }
        }

        // Get link text
        if (
          currentLink &&
          child.type === 'text' &&
          token?.children?.[index - 1]?.type === 'html_inline'
        ) {
          currentLink.text = child.content || ''
          links.push(currentLink)
          currentLink = null
        }
      })
    }
  })

  return links
}

/**
 * Process links by removing duplicates and adding resolved paths
 *
 * @param links - The partially processed links array
 * @param config - The analyzer configuration
 * @param currentFile - The current file path relative to project root
 * @returns The fully processed links array with duplicates removed
 */
const processLinks = (
  links: Partial<PageLink>[],
  config: AnalyzerConfig,
  currentFile: string
): PageLink[] => {
  // Resolve every link first; derive relativePath from the resolved absolute path
  const docsRoot = getDocsRoot(config)
  const processedLinks = links.map((link) => {
    const normalizedPath = normalizeLink(link.relativePath || '')
    const resolved = resolveLinkMultiMode(normalizedPath, config, currentFile)
    const abs = resolved || resolve(docsRoot, normalizedPath || '')
    const rel = relative(docsRoot, abs).replace(/\.md$/, '')
    return {
      ...link,
      absolutePath: abs,
      _relativePathForDedup: rel
    }
  })

  // Remove duplicates
  return processedLinks
    .filter(
      (link, index, self) =>
        index ===
        self.findIndex(
          (l) => l._relativePathForDedup === link._relativePathForDedup
        )
    )
    .map((link) => {
      const { _relativePathForDedup, ...linkWithoutTemp } = link

      return {
        ...linkWithoutTemp,
        relativePath: _relativePathForDedup,
        fullUrl: `/${_relativePathForDedup}`.replace(/\/+/g, '/'),
        text: (link.text || '').split('/').pop() || link.text || '',
        raw: link.raw || ''
      }
    }) as PageLink[]
}

/**
 * Extract links from Markdown content
 *
 * @param content - The Markdown content
 * @param config - The analyzer configuration
 * @param currentFile - The current file path
 * @returns The extracted links array
 */
const extractInnerLinks = (
  content: string,
  config: AnalyzerConfig,
  currentFile: string
): PageLink[] => {
  if (!content) return []

  const tokens = md.parse(content, {})

  const validateLink = createValidateLink(config, currentFile)

  const markdownLinks = extractMarkdownLinks(tokens, validateLink)
  const htmlLinks = extractHtmlLinks(tokens, validateLink)

  const allLinks = [...markdownLinks, ...htmlLinks]

  return processLinks(allLinks, config, currentFile)
}

export { extractInnerLinks }
