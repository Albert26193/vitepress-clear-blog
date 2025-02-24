import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import type { Plugin } from 'vitepress'

import type { PageLink, SiteMetadata } from './types'
import { calculateWords } from './wordCount'

const VIRTUAL_MODULE_ID = 'virtual:markdown-metadata'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

// TODO: do we need a global metadata? alternatively, wrap it in a function?
const globalMdMetadata: SiteMetadata = {}
// TODO: make this configurable
const dirPrefix = 'blogs'

const md = new MarkdownIt({
  linkify: true,
  html: true // Enable HTML tag parsing
})

/**
 * Custom validate link hook to filter internal links, external links, and wikilinks
 *
 * @param {string} link - The link to validate
 * @returns {boolean} True if link is internal, false otherwise
 */
const isExternalLink = (link: string): boolean =>
  link.startsWith('http') ||
  link.startsWith('https') ||
  link.startsWith('#') ||
  link.startsWith('mailto:') ||
  link.startsWith('tel:')

// Constants
const DOCS_DIR = 'docs'

// Utility functions for path handling
const getDocsRoot = (): string => resolve(process.cwd(), DOCS_DIR)

const normalizeLink = (link: string): string => link.split('#')[0]

const resolveDocAbsolutePath = (
  relativePath: string,
  currentFilePath: string
): string => {
  // Since getDocsRoot() always returns absolute path
  const currentFileAbsolutePath = resolve(getDocsRoot(), currentFilePath)

  console.log({
    currentFilePath,
    currentFileAbsolutePath,
    relativePath
  })

  return resolve(dirname(currentFileAbsolutePath), normalizeLink(relativePath))
}

// Convert a file path to URL path (relative to docs directory)
const getUrlPath = (absolutePath: string): string => {
  const relativePath = relative(
    `${process.cwd()}/${DOCS_DIR}`,
    absolutePath
  ).replace(/\.md$/, '.html')

  return relativePath
}

const getFullUrl = (relativePath: string, currentFilePath: string): string => {
  const absolutePath = resolveDocAbsolutePath(relativePath, currentFilePath)
  return getUrlPath(absolutePath)
}

const fileExists = (absolutePath: string): boolean => {
  const mdPath = absolutePath.endsWith('.md')
    ? absolutePath
    : absolutePath + '.md'
  return existsSync(mdPath)
}

const createValidateLink =
  (currentFilePath: string) =>
  (link: string): boolean => {
    if (isExternalLink(link)) {
      return false
    }

    const absolutePath = resolveDocAbsolutePath(link, currentFilePath)
    return fileExists(absolutePath)
  }

// Initialize markdown-it with a default validateLink
md.validateLink = () => false

/**
 * Extract outgoing links from markdown content (a -> b relationships)
 *
 * @param {string} content - The markdown content to parse
 * @returns {PageLink[]} An array of extracted outgoing links
 */
const extractToLinks = (
  content: string,
  currentFilePath: string
): PageLink[] => {
  const links: PageLink[] = []
  const tokens = md.parse(content, {})

  md.validateLink = createValidateLink(currentFilePath)

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      let currentLink: Partial<PageLink> | null = null

      token.children.forEach((child, index) => {
        // 1. Handle markdown standard links
        if (child.type === 'link_open') {
          const href = child.attrGet('href')
          if (href && md.validateLink(href)) {
            currentLink = {
              relativePath: href.replace(/\.md$/, ''),
              type: 'markdown'
            }
          }
        }

        // 2. Handle HTML <a> tags
        if (child.type === 'html_inline' && child.content.startsWith('<a ')) {
          const hrefMatch = child.content.match(/href="([^"]*)"/)
          if (hrefMatch && hrefMatch[1] && md.validateLink(hrefMatch[1])) {
            currentLink = {
              relativePath: hrefMatch[1].replace(/\.md$/, ''),
              type: 'html'
            }
          }
        }
        // Get link text
        if (
          currentLink &&
          ((child.type === 'text' &&
            token?.children?.[index - 1]?.type === 'link_open') ||
            (child.type === 'text' &&
              token?.children?.[index - 1]?.type === 'html_inline'))
        ) {
          currentLink.text = child.content || ''
          currentLink.raw = `[${child.content}](${currentLink.relativePath})`
          links.push(currentLink as PageLink)
          currentLink = null
        }

        // 3. Handle wikilink
        if (child.type === 'text' && child.content.includes('[[')) {
          const wikiMatches = child.content.match(/\[\[(.*?)\]\]/g)
          if (wikiMatches && wikiMatches.length > 0) {
            wikiMatches.forEach((match) => {
              const content = match.slice(2, -2)
              const [text, path] = content.split('|')
              if (md.validateLink(text)) {
                links.push({
                  text: text || path,
                  relativePath: text.toLowerCase().replace(/\s+/g, '-'),
                  fullUrl: '',
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

  // Remove duplicates, prioritize markdown type links
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
      relativePath: getFullUrl(link.relativePath, currentFilePath),
      fullUrl: `/${getFullUrl(link.relativePath, currentFilePath)}`,
      text: link.text.split('/').pop() || link.text
    }))
}

/**
 * Extract heading content for a given heading token
 *
 * @param tokens - The tokens of the markdown content
 * @param index - The index of the heading token, namely the position for the heading
 * @returns {string} The content of the heading
 */
const extractHeadingContent = (tokens: Token[], index: number): string => {
  const contentToken = tokens[index + 1]
  if (!contentToken || contentToken.type !== 'inline') return ''

  return (
    contentToken.children
      ?.map((child) => (child.content ?? '') as string)
      .join('')
      .trim() || ''
  )
}

/**
 * Extract the first heading from markdown content, Rules:
 * 1. if first title is h1 or h2, return first title.
 * 2. if first title not h1 and h2, return 'no-heading'
 *
 * @param {string} content - The markdown content to parse
 * @returns {string | null} The first heading text or null if not found
 */
const extractFirstHeading = (content: string): string | null => {
  if (!content) return null
  const tokens: Token[] = md.parse(content, {})

  /**
   * Rules for valid heading
   *  - if first heading is H1 or H2, return it
   *  - if lower than H2, return string 'no-heading'
   *  - heading must meet all conditions:
   *    1. type is heading_open or heading_close
   *    2. markup is 1-6 '#' characters
   *    3. tag is h1-h6
   */
  const isValidHeading = (token: Token): boolean => {
    const validTypes = ['heading_open', 'heading_close']
    const markupRegex = /^#{1,6}$/
    const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    return (
      validTypes.includes(token.type) &&
      markupRegex.test(token.markup) &&
      validTags.includes(token.tag)
    )
  }

  const findFirstHeading = (tokens: Token[]): string => {
    if (!tokens.length) return 'no-heading'
    const headingTokenIndex = tokens.findIndex(isValidHeading)
    if (headingTokenIndex === -1) return 'no-heading'
    const token = tokens[headingTokenIndex]
    const level = token.markup.length
    const content = extractHeadingContent(tokens, headingTokenIndex)
    if (!content) return 'no-heading'
    // if heading is H1 or H2, return it
    if (level <= 2) return content
    // if lower than H2, return string 'no-heading'
    return 'no-heading'
  }

  return findFirstHeading(tokens)
}

/**
 * Analyze a markdown file and extract metadata, such as word count, headings, and links
 *
 * @param {string} filePath - Path to the markdown file
 */

// MARK: analyzeMdFile
const analyzeMdFile = (filePath: string) => {
  const content = readFileSync(filePath, 'utf-8')
  const stats = statSync(filePath)

  // Get relative path from project root
  const filePathBasedOnProj = relative(process.cwd(), filePath)
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')

  // Extract all internal links
  const outgoingLinks = extractToLinks(content, filePath)

  // Store the toLinks in global metadata
  if (!globalMdMetadata[filePathBasedOnProj]) {
    globalMdMetadata[filePathBasedOnProj] = {
      outgoingLinks: [],
      backLinks: [],
      wordCount: 0,
      rawContent: '',
      headings: [],
      lastUpdated: 0
    }
  }
  globalMdMetadata[filePathBasedOnProj].outgoingLinks = outgoingLinks

  // Extract headings and log results
  const firstHead = extractFirstHeading(content)

  // Calculate word count
  const wordCount = calculateWords(content)
  globalMdMetadata[filePathBasedOnProj].wordCount = wordCount
  // TODO：temp put it to raw content
  globalMdMetadata[filePathBasedOnProj].rawContent = firstHead as string
  globalMdMetadata[filePathBasedOnProj].lastUpdated = stats.mtimeMs
}

/**
 * Build backLinks for all files in the global metadata
 * This should be called after all files have been processed
 * to ensure we have all the to_links information
 */
const buildGlobalBackLinks = () => {
  // clear backLinks
  Object.values(globalMdMetadata).forEach((metadata) => {
    metadata.backLinks = []
  })

  // traverse globalMdMetadata
  Object.entries(globalMdMetadata).forEach(([sourceFile, metadata]) => {
    // ensure toLinks
    if (!metadata.outgoingLinks) {
      // console.warn(`No Links found for ${sourceFile}`)
      return
    }

    metadata.outgoingLinks.forEach((link) => {
      const targetFile = `${link.relativePath}`
      console.log({ targetFile })

      console.log(JSON.stringify(globalMdMetadata))
      if (globalMdMetadata[targetFile]) {
        if (!globalMdMetadata[targetFile].backLinks) {
          globalMdMetadata[targetFile].backLinks = []
        }

        const newBackLink = {
          text: sourceFile.split('/').pop() || 'no-name',
          // TODO: relative path is wrong
          // BUG
          relativePath: sourceFile,
          fullUrl: `/${sourceFile}`,
          type: link.type,
          raw: link.raw
        }

        console.log({ newBackLink })
        const exists = globalMdMetadata[targetFile].backLinks.some(
          (bl) => bl.relativePath === newBackLink.relativePath
        )

        if (!exists) {
          globalMdMetadata[targetFile].backLinks.push(newBackLink)
        }
      }
    })
  })

  // debug:
  // Object.entries(globalMdMetadata).forEach(([file, metadata]) => {
  //   console.log(`File: ${file}`)
  //   console.log(`  outgoingLinks: ${metadata.outgoingLinks?.length || 0}`)
  //   console.log(`  backLinks: ${metadata.backLinks?.length || 0}`)
  // })
}

const scanDir = (dir: string) => {
  const files = readdirSync(dir)
  files.forEach((file) => {
    const fullPath = resolve(dir, file)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      scanDir(fullPath)
    } else if (file.endsWith('.md')) {
      analyzeMdFile(fullPath)
    }
  })
}

/**
 * VitePress plugin for markdown file analysis, including word count, headings, and links
 *
 * @returns {Plugin} VitePress plugin instance
 */
export function markdownAnalyzerPlugin(): Plugin {
  console.log('\n[Analyzer Plugin] Initializing...')
  const docsRoot = getDocsRoot()
  const blogDir = resolve(docsRoot, dirPrefix)
  console.log('[Analyzer Plugin] Docs root:', docsRoot)
  console.log('[Analyzer Plugin] Blog directory:', blogDir)

  return {
    name: 'vitepress-plugin-analyzer',
    buildStart() {
      scanDir(blogDir)
      buildGlobalBackLinks()
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        console.log('[Analyzer Plugin] Global metadata:', globalMdMetadata)
        return `
          export const globalMdMetadata = ${JSON.stringify(globalMdMetadata, null, 2)}
        `
      }
    }
  }
}
