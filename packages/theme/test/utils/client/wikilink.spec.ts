/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import type { SiteMetadata } from '../../../src/types/types.d'
import {
  BROKEN_WIKI_LINK_CLASS,
  getWikiLinkCandidates,
  markBrokenWikiLinks
} from '../../../src/utils/client/wikilink'

const siteMetadata: SiteMetadata = {
  'blogs/existing': {
    outgoingLinks: [],
    backLinks: [],
    wordCount: 10,
    firstHeading: 'Existing',
    lastUpdated: 1
  },
  root: {
    outgoingLinks: [],
    backLinks: [],
    wordCount: 10,
    firstHeading: 'Root',
    lastUpdated: 1
  }
}

describe('getWikiLinkCandidates', () => {
  it('checks direct and current-page-relative candidates', () => {
    const candidates = getWikiLinkCandidates('/existing', {
      currentPath: '/blogs/current'
    })

    expect(candidates).toEqual(['existing', 'blogs/existing'])
  })

  it('removes VitePress base before matching metadata paths', () => {
    const candidates = getWikiLinkCandidates('/blog-base/root.html', {
      base: '/blog-base/',
      currentPath: '/blog-base/blogs/current'
    })

    expect(candidates).toContain('root')
  })

  it('treats the configured base path itself as root', () => {
    const candidates = getWikiLinkCandidates('/blog-base', {
      base: '/blog-base/',
      currentPath: '/blog-base/blogs/current'
    })

    expect(candidates).toEqual([])
  })

  it('keeps paths outside the configured base unchanged', () => {
    const candidates = getWikiLinkCandidates('/external-root', {
      base: '/blog-base/',
      currentPath: '/blog-base/blogs/current'
    })

    expect(candidates).toContain('external-root')
  })

  it('reads pathnames from absolute URLs', () => {
    const candidates = getWikiLinkCandidates(
      'https://example.test/blogs/existing.html?from=test#section',
      {
        currentPath: '/blogs/current'
      }
    )

    expect(candidates).toContain('blogs/existing')
  })

  it('normalizes relative path segments', () => {
    const candidates = getWikiLinkCandidates('../shared', {
      currentPath: '/blogs/current'
    })

    expect(candidates).toContain('shared')
  })

  it('normalizes current-directory relative paths', () => {
    const candidates = getWikiLinkCandidates('./existing', {
      currentPath: '/blogs/current'
    })

    expect(candidates).toContain('existing')
    expect(candidates).toContain('blogs/existing')
  })

  it('falls back to window location when currentPath is omitted', () => {
    window.history.replaceState(null, '', '/blogs/current')

    const candidates = getWikiLinkCandidates('/root', {})

    expect(candidates).toContain('root')
    expect(candidates).toContain('blogs/root')
  })

  it('returns no candidates for root-only links', () => {
    const candidates = getWikiLinkCandidates('/', {
      currentPath: '/blogs/current'
    })

    expect(candidates).toEqual([])
  })
})

describe('markBrokenWikiLinks', () => {
  it('marks unresolved wiki links without changing existing links', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink" href="/existing">Existing</a>
        <a class="clear-wikilink" href="/missing">Missing</a>
      </main>
    `

    markBrokenWikiLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })

    const existing = document.querySelector<HTMLAnchorElement>(
      'a[href="/existing"]'
    )
    const missing =
      document.querySelector<HTMLAnchorElement>('a[href="/missing"]')

    expect(existing?.classList.contains(BROKEN_WIKI_LINK_CLASS)).toBe(false)
    expect(existing?.hasAttribute('data-wikilink-broken')).toBe(false)
    expect(missing?.classList.contains(BROKEN_WIKI_LINK_CLASS)).toBe(true)
    expect(missing?.getAttribute('data-wikilink-broken')).toBe('')
  })

  it('is idempotent when called after route changes', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink clear-wikilink--broken" href="/root">Root</a>
      </main>
    `

    markBrokenWikiLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })
    markBrokenWikiLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })

    const root = document.querySelector<HTMLAnchorElement>('a[href="/root"]')
    expect(root?.classList.contains(BROKEN_WIKI_LINK_CLASS)).toBe(false)
  })

  it('ignores wiki links without hrefs', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink">No target</a>
      </main>
    `

    expect(() => markBrokenWikiLinks(siteMetadata)).not.toThrow()
    expect(
      document
        .querySelector('.clear-wikilink')
        ?.classList.contains(BROKEN_WIKI_LINK_CLASS)
    ).toBe(false)
  })
})
