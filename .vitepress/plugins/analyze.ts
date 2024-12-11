import type { PageLink, SiteMetadata } from '@/theme/types'
import fs from 'fs-extra'
import MarkdownIt from 'markdown-it'
import path from 'path'
import { Plugin } from 'vitepress'

const VIRTUAL_MODULE_ID = 'virtual:markdown-metadata'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const globalMdMetadata: SiteMetadata = {}

// Create markdown instance
const md = new MarkdownIt({ linkify: true })

// Custom validLink hook to filter internal links
md.validateLink = (link: string) => {
  // Filter out external links and anchor links
  return (
    !link.startsWith('http') &&
    !link.startsWith('#') &&
    !link.startsWith('https')
  )
}

// Extract all links
function extractLinks(content: string): PageLink[] {
  const links: PageLink[] = []
  const tokens = md.parse(content, {})

  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      let currentLink: Partial<PageLink> | null = null

      token.children.forEach((child, index) => {
        // Handle markdown standard links
        if (child.type === 'link_open') {
          const href = child.attrGet('href')
          if (href && md.validateLink(href)) {
            currentLink = {
              path: href.replace(/\.md$/, ''),
              type: 'markdown'
            }
          }
        }

        // Get link text
        if (
          currentLink &&
          child.type === 'text' &&
          token?.children?.[index - 1]?.type === 'link_open'
        ) {
          currentLink.text = child.content
          currentLink.raw = `[${child.content}](${currentLink.path})`
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
                path: text.toLowerCase().replace(/\s+/g, '-'),
                type: 'wiki',
                raw: match
              })
            })
          }
        }
      })
    }
  })

  // Remove duplicates, prioritize markdown type links
  return links.filter(
    (link, index, self) =>
      index ===
      self.findIndex(
        (l) =>
          l.path === link.path &&
          (l.type === 'markdown' || link.type === 'markdown'
            ? l.type === link.type
            : true)
      )
  )
}

// Extract headings
const extractHeadings = (content: string) => {
  return content
    .split('\n')
    .filter((line) => line.startsWith('#'))
    .map((line) => {
      const level = line.match(/^#+/)![0].length
      const text = line.replace(/^#+\s+/, '')
      const slug = text.toLowerCase().replace(/\s+/g, '-')
      return { level, text, slug }
    })
}

// Analyze markdown file
const analyzeMdFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const stats = fs.statSync(filePath)

  const relativePath = path
    .relative(process.cwd(), filePath)
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')

  // Extract all internal links
  const innerLinks = extractLinks(content)

  // Extract headings
  // const headings = extractHeadings(content)

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

// VitePress plugin for markdown analysis
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
    //TODO: 'docs' should be configurable
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
