import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { existsSync } from 'node:fs'
import { dirname, join, normalize, resolve } from 'node:path'

import type { AnalyzerConfig } from '../core/config'
import type { PageLink } from '../types'

// Initialize markdown-it instance
const md = new MarkdownIt({
  linkify: true,
  html: true // Enable HTML tag parsing
})

/**
 * Get the absolute path to the docs root directory
 * This function assumes it's being called in the context of a VitePress site
 * where config.docsDir is relative to the current working directory
 *
 * @param config - The analyzer configuration
 * @returns The absolute path to the docs root directory
 */
const getDocsRoot = (config: AnalyzerConfig): string => {
  return resolve(process.cwd(), config.docsDir)
}

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
 * Normalize a link by removing the anchor part
 *
 * @param link - The link to normalize
 * @returns The normalized link
 */
const normalizeLink = (link: string): string => link.split('#')[0]

/**
 * Check if a file exists at the given absolute path
 * Supports both with and without .md extension
 *
 * @param absolutePath - The absolute path to check
 * @returns True if the file exists, false otherwise
 */
const fileExists = (absolutePath: string): boolean => {
  console.log(absolutePath, existsSync(absolutePath))
  // Try exact path first
  if (existsSync(absolutePath)) {
    return true
  }

  // If path doesn't end with .md, try with .md extension
  if (!absolutePath.endsWith('.md')) {
    return existsSync(absolutePath + '.md')
  }

  return false
}

/**
 * Get the path relative to the project root (docs directory).
 * This function converts any path (absolute or relative) to a path relative to the project root.
 * Example:
 *  - Project root: /path/to/docs
 *  - Current file: /path/to/docs/posts/post1.md
 *  - Input link: ../pages/about.md
 *  - Output: pages/about
 *
 * @param relativePath - The input path (can be absolute or relative)
 * @param currentFile - The current file path relative to project root
 * @returns The path relative to project root, without extension
 */
const getProjectRelativePath = (
  relativePath: string,
  currentFile: string
): string => {
  // Remove anchor part and normalize the path
  const pathWithoutAnchor = normalizeLink(relativePath)

  // If it's an absolute path (starts with /), just remove the leading slash
  if (pathWithoutAnchor.startsWith('/')) {
    return pathWithoutAnchor.substring(1).replace(/\.md$/, '')
  }

  // For relative paths, resolve against current file's location
  const currentDir = dirname(currentFile)

  // Join paths to get the full path relative to the current directory
  let fullPath = join(currentDir, pathWithoutAnchor)

  // Normalize the path to remove .. segments, but keep it relative
  // We don't want to use path.resolve here as it would create an absolute path
  fullPath = normalize(fullPath).replace(/\\/g, '/')

  // Make sure the path doesn't start with a slash and remove .md extension
  return fullPath
    .replace(/\.md$/, '') // Remove .md extension
    .replace(/^\//, '') // Remove leading slash if exists
}

/**
 * Resolve the absolute path in the file system.
 * This function converts any path to its absolute location on disk.
 *
 * @param config - The analyzer configuration
 * @param relativePath - The input path (can be absolute or relative)
 * @param currentFile - The current file path relative to project root
 * @returns The absolute path in the file system
 */
const resolveAbsolutePath = (
  config: AnalyzerConfig,
  relativePath: string,
  currentFile: string
): string => {
  const currentFileAbsolutePath = resolve(getDocsRoot(config), currentFile)
  console.log('currentFileAbsolutePath', currentFileAbsolutePath)
  // If it's an absolute path (starts with /), resolve from docs root
  const normalizedPath = normalizeLink(relativePath)
  if (normalizedPath.startsWith('/')) {
    return resolve(getDocsRoot(config), normalizedPath.substring(1))
  }

  // For relative paths, resolve from current file's directory
  return resolve(dirname(currentFileAbsolutePath), normalizedPath)
}

/**
 * Create a link validation function
 * This function checks if:
 * 1. The link is not external
 * 2. The link is not empty after normalization
 * 3. The target file exists in the file system
 *
 * @param config - The analyzer configuration
 * @param currentFile - The current file path
 * @returns A link validation function
 */
const createValidateLink =
  (config: AnalyzerConfig, currentFile: string) =>
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

    // Check if the file exists
    const absolutePath = resolveAbsolutePath(
      config,
      normalizedLink,
      currentFile
    )
    return fileExists(absolutePath)
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
 * Extract Wiki links from tokens, be like 3 situations:
 * 1. [[ as-short-as-possible ]] if not have same name with file name
 * 2. [[ relative-path-based-on-current-file | display text ]]
 * 3. [[ absolute-path-based-on-docs-root | display text ]]
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
  // First, normalize all paths to make comparison consistent
  const processedLinks = links.map((link) => {
    // Calculate normalized path (without .. segments)
    const normalizedPath = getProjectRelativePath(
      link.relativePath || '',
      currentFile
    )
    return {
      ...link,
      // Store normalized path temporarily for deduplication
      _normalizedPathForDedup: normalizedPath
    }
  })

  // Remove duplicates, prioritizing Markdown type links
  return processedLinks
    .filter(
      (link, index, self) =>
        index ===
        self.findIndex(
          (l) =>
            l._normalizedPathForDedup === link._normalizedPathForDedup &&
            // If several links have the same normalized path, keep markdown type
            (l.type === 'markdown' || link.type === 'markdown'
              ? l.type === link.type
              : true)
        )
    )
    .map((link) => {
      // Calculate final paths
      const processedRelativePath = link._normalizedPathForDedup

      // Create the final link object without the temporary field
      const { _normalizedPathForDedup, ...linkWithoutTemp } = link

      return {
        ...linkWithoutTemp,
        absolutePath: resolveAbsolutePath(
          config,
          link.relativePath || '',
          currentFile
        ),
        relativePath: processedRelativePath, // Use the normalized path
        fullUrl: `/${processedRelativePath}`.replace(/\/+/g, '/'),
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
export const extractInnerLinks = (
  content: string,
  config: AnalyzerConfig,
  currentFile: string
): PageLink[] => {
  // If content is empty, return an empty array
  if (!content) return []

  // Parse Markdown content into tokens
  const tokens = md.parse(content, {})

  // Create link validation function
  const validateLink = createValidateLink(config, currentFile)

  // Extract various types of links
  const markdownLinks = extractMarkdownLinks(tokens, validateLink)
  const htmlLinks = extractHtmlLinks(tokens, validateLink)
  const wikiLinks = extractWikiLinks(tokens, validateLink)

  // Merge all links
  const allLinks = [...markdownLinks, ...htmlLinks, ...wikiLinks]

  // Process links, add full URLs
  return processLinks(allLinks, config, currentFile)
}
