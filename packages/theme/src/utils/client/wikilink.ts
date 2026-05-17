import type { SiteMetadata } from '../../types/types'
import type { Post } from '../../types/types.d'
import { resolveLinkTitle } from './resolve-title'

interface WikiLinkOptions {
  base?: string
  currentPath?: string
  root?: ParentNode
  renderTitle?: string
  allPosts?: Post[]
}

const WIKI_LINK_SELECTOR = 'a.clear-wikilink'
const INTERNAL_LINK_SELECTOR = '.vp-doc a[href], a.clear-wikilink'
const BROKEN_LINK_CLASS = 'broken-link'

const trimBase = (path: string, base = '/'): string => {
  if (!base || base === '/') return path

  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, '')}/`
  if (path === normalizedBase.slice(0, -1)) return '/'
  if (path.startsWith(normalizedBase)) {
    return `/${path.slice(normalizedBase.length)}`
  }
  return path
}

const normalizeMetadataPath = (path: string): string =>
  path
    .split(/[?#]/)[0]
    .replace(/\.html$/, '')
    .replace(/\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')

const normalizeRelativeSegments = (path: string): string => {
  const segments: string[] = []
  path.split('/').forEach((segment) => {
    if (!segment || segment === '.') return
    if (segment === '..') {
      segments.pop()
      return
    }
    segments.push(segment)
  })
  return segments.join('/')
}

const getCurrentDirectory = (currentPath: string): string => {
  const normalizedCurrent = normalizeMetadataPath(currentPath)
  const parts = normalizedCurrent.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * Produces normalized lookup keys for a link href from both absolute and page-relative contexts.
 */
const getWikiLinkCandidates = (
  href: string,
  options: Pick<WikiLinkOptions, 'base' | 'currentPath'>
): string[] => {
  const candidates = new Set<string>()
  const currentPath =
    options.currentPath ||
    (typeof window !== 'undefined' ? window.location.pathname : '')

  let pathname = href
  if (!href.startsWith('.') && !href.startsWith('/')) {
    try {
      pathname = new URL(href, window.location.origin).pathname
    } catch {
      // Keep the raw href for non-browser unit tests and malformed hrefs.
    }
  }

  const directPath = normalizeMetadataPath(trimBase(pathname, options.base))
  if (directPath) {
    candidates.add(normalizeRelativeSegments(directPath))
  }

  const currentDir = getCurrentDirectory(currentPath)
  if (currentDir && directPath && !directPath.startsWith(currentDir + '/')) {
    candidates.add(normalizeRelativeSegments(`${currentDir}/${directPath}`))
  }

  return Array.from(candidates)
}

const createExistingPageSet = (siteMetadata: SiteMetadata): Set<string> =>
  new Set(Object.keys(siteMetadata).map(normalizeMetadataPath))

const isExternalHref = (href: string): boolean =>
  href.startsWith('http') ||
  href.startsWith('https') ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:') ||
  href.startsWith('#')

/**
 * Resolves the canonical title for a wiki link target by matching against posts data.
 * Thin wrapper around resolveLinkTitle that preserves the legacy null-returning contract.
 */
const resolveInlineWikiTitle = (
  relativePath: string,
  allPosts: Post[],
  renderTitle: string
): string | null => {
  if (renderTitle === 'alias') return null

  let linkPath: string
  if (relativePath.endsWith('.md')) {
    linkPath = '/' + relativePath.replace(/\.md$/, '.html')
  } else {
    linkPath = '/' + relativePath + '.html'
  }

  const matchedPost = allPosts.find(
    (post: Post) => post.regularPath === linkPath
  )
  if (!matchedPost) return null

  switch (renderTitle) {
    case 'file_name':
      return (
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') || null
      )

    case 'frontmatter_title':
      return matchedPost.frontMatter.title || null

    case 'first_heading': {
      if (typeof document !== 'undefined') {
        const div = document.createElement('div')
        div.innerHTML = matchedPost.html || ''
        const heading = div.querySelector('h1, h2')
        if (heading?.textContent) return heading.textContent.trim()
      }
      return matchedPost.frontMatter.title || null
    }

    default:
      return null
  }
}

/**
 * Marks unresolved internal links in rendered content and optionally replaces link text
 * with the canonical page title. Handles both wiki links (a.clear-wikilink) and
 * standard markdown links.
 *
 * @param siteMetadata - Analyzer metadata used as the source of existing pages.
 * @param options - DOM, path context, and title resolution config.
 */
const markBrokenLinks = (
  siteMetadata: SiteMetadata,
  options: WikiLinkOptions = {}
): void => {
  const root = options.root || document
  const existingPages = createExistingPageSet(siteMetadata)
  const allLinks = root.querySelectorAll<HTMLAnchorElement>(
    INTERNAL_LINK_SELECTOR
  )
  const allPosts = options.allPosts || []
  const renderTitle = options.renderTitle || 'alias'

  allLinks.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href || isExternalHref(href)) {
      link.removeAttribute('data-link-internal')
      link.classList.remove(BROKEN_LINK_CLASS)
      link.removeAttribute('data-link-broken')
      link.removeAttribute('data-wikilink-broken')
      return
    }

    const isWikiLink = link.classList.contains('clear-wikilink')
    const candidates = getWikiLinkCandidates(href, options)
    const matched = candidates.find((candidate) => existingPages.has(candidate))
    const exists = !!matched

    link.toggleAttribute('data-link-internal', true)
    link.classList.toggle(BROKEN_LINK_CLASS, !exists)
    link.toggleAttribute('data-link-broken', !exists)
    link.toggleAttribute('data-wikilink-broken', isWikiLink && !exists)

    if (exists && matched && renderTitle !== 'alias') {
      const title = resolveLinkTitle(
        matched,
        allPosts,
        renderTitle,
        link.textContent || ''
      )
      if (title) {
        link.textContent = title
      }
    }
  })
}

export {
  BROKEN_LINK_CLASS,
  INTERNAL_LINK_SELECTOR,
  WIKI_LINK_SELECTOR,
  getWikiLinkCandidates,
  markBrokenLinks,
  resolveInlineWikiTitle
}
export type { WikiLinkOptions }
