import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { dirname, join } from 'node:path'

import type { PageLink } from '../types'

// Initialize markdown-it instance
const md = new MarkdownIt({
  linkify: true,
  html: true // Enable HTML tag parsing
})

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
  link.startsWith('tel:')

/**
 * Normalize a link by removing the anchor part
 *
 * @param link - The link to normalize
 * @returns The normalized link
 */
const normalizeLink = (link: string): string => link.split('#')[0]

/**
 * Resolve the document path while preserving relative paths
 *
 * @param relativePath - The relative path
 * @param currentFile - The current file path
 * @returns The resolved path, maintaining relative format
 */
const resolveDocPath = (relativePath: string, currentFile: string): string => {
  // Remove anchor part from the path
  const pathWithoutAnchor = normalizeLink(relativePath)

  // If it's an absolute path (starts with /), return it directly (remove the leading /)
  if (pathWithoutAnchor.startsWith('/')) {
    return pathWithoutAnchor.substring(1)
  }

  // If it's a relative path, join it with the current directory
  const currentDir = dirname(currentFile)
  // Remove .md extension and ensure the path is relative
  return join(currentDir, pathWithoutAnchor)
    .replace(/\.md$/, '')
    .replace(/^\//, '')
}

/**
 * Create a link validation function
 *
 * @param currentFile - The current file path
 * @returns A link validation function
 */
const createValidateLink =
  (currentFile: string) =>
  (link: string): boolean => {
    // If it's an external link, return false
    if (isExternalLink(link)) {
      return false
    }

    // Normalize the link (remove anchor)
    const normalizedLink = normalizeLink(link)

    // If the link is empty, return false
    if (!normalizedLink) {
      return false
    }

    return true
  }

/**
 * Extract standard Markdown links from tokens
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
        // Handle standard Markdown links
        if (child.type === 'link_open') {
          const href = child.attrGet('href')
          if (href && validateLink(href)) {
            currentLink = {
              relativePath: href,
              type: 'markdown',
              raw: ''
            }
          }
        }

        // Get link text
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
 * Extract HTML links from tokens
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
 * Extract Wiki links from tokens
 *
 * @param tokens - The Markdown tokens array
 * @param validateLink - The link validation function
 * @returns The extracted links array
 */
const extractWikiLinks = (
  tokens: Token[],
  validateLink: (link: string) => boolean
): Partial<PageLink>[] => {
  const links: Partial<PageLink>[] = []

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      token.children.forEach((child) => {
        // Handle Wiki links [[text]] or [[text|path]]
        if (child.type === 'text' && child.content.includes('[[')) {
          const wikiMatches = child.content.match(/\[\[(.*?)\]\]/g)
          if (wikiMatches && wikiMatches.length > 0) {
            wikiMatches.forEach((match) => {
              const content = match.slice(2, -2)
              let text: string, path: string

              if (content.includes('|')) {
                // For links with display text: [[Target Path|Display Text]]
                ;[text, path] = content.split('|').reverse()
              } else {
                // For simple links: [[Simple Link]], convert to URL-friendly format ?
                // Not convert
                text = content
                path = content
                // path = content.toLowerCase().replace(/\s+/g, '-')
              }

              if (validateLink(path)) {
                links.push({
                  text: text,
                  relativePath: path,
                  type: 'wiki',
                  raw: match
                })
              }
            })
          }
        }
      })
    }
  })

  return links
}

/**
 * Process links, add full URLs
 *
 * @param links - The partially processed links array
 * @param currentFile - The current file path
 * @returns The fully processed links array
 */
const processLinks = (
  links: Partial<PageLink>[],
  currentFile: string
): PageLink[] => {
  // Remove duplicates, prioritize Markdown type links
  return links
    .filter(
      (link, index, self) =>
        index ===
        self.findIndex(
          (l) =>
            l.relativePath === link.relativePath &&
            (l.type === 'markdown' || link.type === 'markdown'
              ? l.type === link.type
              : true)
        )
    )
    .map((link) => ({
      ...link,
      relativePath: resolveDocPath(link.relativePath || '', currentFile),
      fullUrl:
        `/${resolveDocPath(link.relativePath || '', currentFile)}`.replace(
          /\/+/g,
          '/'
        ),
      text: (link.text || '').split('/').pop() || link.text || '',
      raw: link.raw || ''
    })) as PageLink[]
}

/**
 * Extract links from Markdown content
 *
 * @param content - The Markdown content
 * @param currentFile - The current file path
 * @returns The extracted links array
 */
export const extractInnerLinks = (
  content: string,
  currentFile: string
): PageLink[] => {
  // If content is empty, return an empty array
  if (!content) return []

  // Parse Markdown content into tokens
  const tokens = md.parse(content, {})

  // Create link validation function
  const validateLink = createValidateLink(currentFile)

  // Extract various types of links
  const markdownLinks = extractMarkdownLinks(tokens, validateLink)
  const htmlLinks = extractHtmlLinks(tokens, validateLink)
  const wikiLinks = extractWikiLinks(tokens, validateLink)

  // Merge all links
  const allLinks = [...markdownLinks, ...htmlLinks, ...wikiLinks]

  // Process links, add full URLs
  return processLinks(allLinks, currentFile)
}
