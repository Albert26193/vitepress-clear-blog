import type { SiteMetadata } from '../../types/types'

interface WikiLinkOptions {
  base?: string
  currentPath?: string
  root?: ParentNode
}

const WIKI_LINK_SELECTOR = 'a.clear-wikilink'
const BROKEN_WIKI_LINK_CLASS = 'clear-wikilink--broken'

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

const markBrokenWikiLinks = (
  siteMetadata: SiteMetadata,
  options: WikiLinkOptions = {}
): void => {
  const root = options.root || document
  const existingPages = createExistingPageSet(siteMetadata)
  const wikiLinks = root.querySelectorAll<HTMLAnchorElement>(WIKI_LINK_SELECTOR)

  wikiLinks.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href) return

    const exists = getWikiLinkCandidates(href, options).some((candidate) =>
      existingPages.has(candidate)
    )
    link.classList.toggle(BROKEN_WIKI_LINK_CLASS, !exists)
    link.toggleAttribute('data-wikilink-broken', !exists)
  })
}

export {
  BROKEN_WIKI_LINK_CLASS,
  WIKI_LINK_SELECTOR,
  getWikiLinkCandidates,
  markBrokenWikiLinks
}
