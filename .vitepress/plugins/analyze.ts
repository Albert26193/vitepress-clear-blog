import type { PageLink, SiteMetadata } from '@/theme/types.d'
import fs from 'fs-extra'
import MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'
import path, { relative } from 'path'
import { Plugin } from 'vitepress'

const VIRTUAL_MODULE_ID = 'virtual:markdown-metadata'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const globalMdMetadata: SiteMetadata = {}

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

const normalizeLink = (link: string): string => link.split('#')[0]

const resolveFilePath = (link: string, currentFilePath: string): string =>
  path.resolve(path.dirname(currentFilePath), normalizeLink(link))

const fileExists = (filePath: string): boolean =>
  !path.extname(filePath)
    ? fs.existsSync(filePath + '.md') || fs.existsSync(filePath + '/index.md')
    : fs.existsSync(filePath)

const createValidateLink =
  (currentFilePath: string) =>
  (link: string): boolean =>
    !isExternalLink(link) && fileExists(resolveFilePath(link, currentFilePath))

md.validateLink = () => false // Initialize with a default value

const getFullUrl = (relativePath: string): string => {
  const basicUrl = '/blogs'
  return `${basicUrl}/${relativePath}.html`
}

/**
 * Extract all links from markdown content
 *
 * @param {string} content - The markdown content to parse
 * @returns {PageLink[]} An array of extracted links
 */
const extractLinks = (content: string, currentFilePath: string): PageLink[] => {
  const links: PageLink[] = []
  const tokens = md.parse(content, {})

  md.validateLink = createValidateLink(currentFilePath)

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      let currentLink: Partial<PageLink> | null = null

      token.children.forEach((child, index) => {
        // Handle markdown standard links
        if (child.type === 'link_open') {
          const href = child.attrGet('href')
          if (href && md.validateLink(href)) {
            currentLink = {
              relativePath: href.replace(/\.md$/, ''),
              type: 'markdown'
            }
          }
        }

        // Handle HTML <a> tags
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
          currentLink.text = child.content
          currentLink.raw = `[${child.content}](${currentLink.relativePath})`
          links.push(currentLink as PageLink)
          currentLink = null
        }
        // Handle wikilink
        if (child.type === 'text' && child.content.includes('[[')) {
          const wikiMatches = child.content.match(/\[\[(.*?)\]\]/g)
          if (wikiMatches) {
            wikiMatches.forEach((match) => {
              const content = match.slice(2, -2)
              const [text, path] = content.split('|').reverse()
              links.push({
                text: path || text,
                relativePath: text.toLowerCase().replace(/\s+/g, '-'),
                fullUrl: '',
                type: 'wiki',
                raw: match
              })
              // console.log(links, 'links')
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
      fullUrl: getFullUrl(link.relativePath)
    }))
}

const extractHeadingContent = (tokens: Token[], index: number): string => {
  const contentToken = tokens[index + 1]
  if (contentToken?.type !== 'inline') return ''

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
const analyzeMdFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const stats = fs.statSync(filePath)

  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')

  console.log('relative', relativePath)
  // Extract all internal links
  const innerLinks = extractLinks(content, filePath)
  console.log(innerLinks, 'inner')

  // Extract headings and log results
  const firstHead = extractFirstHeading(content)

  // Calculate word count
  const wordCount = content
    .replace(/\s+/g, '')
    .replace(/[\u4e00-\u9fa5]/g, 'm').length

  globalMdMetadata[relativePath] = {
    wordCount,
    innerLinks,
    rawContent: content,
    headings: [],
    lastUpdated: stats.mtimeMs
  }
}

/**
 * VitePress plugin for markdown file analysis, including word count, headings, and links
 *
 * @returns {Plugin} VitePress plugin instance
 */
const markdownAnalyzerPlugin = (): Plugin => ({
  name: 'vitepress-markdown-analyzer',
  configureServer(server) {
    server.watcher.add('**/*.md')
    server.watcher.on('change', (file) => {
      if (file.endsWith('.md')) {
        analyzeMdFile(file)
      }
    })
    server.watcher.on('add', (file) => {
      if (file.endsWith('.md')) {
        analyzeMdFile(file)
      }
    })
  },
  buildStart() {
    const scanDir = (dir: string) => {
      const files = fs.readdirSync(dir)
      files.forEach((file) => {
        const fullPath = path.join(dir, file)
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath)
        } else if (file.endsWith('.md')) {
          analyzeMdFile(fullPath)
        }
      })
    }
    // TODO: 'docs' should be configurable
    scanDir(path.resolve(process.cwd(), 'docs'))
  },
  resolveId(id) {
    if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
  },
  load(id) {
    if (id === RESOLVED_VIRTUAL_MODULE_ID) {
      return `export const globalMdMetadata = ${JSON.stringify(globalMdMetadata)}`
    }
  }
})

export { markdownAnalyzerPlugin }
