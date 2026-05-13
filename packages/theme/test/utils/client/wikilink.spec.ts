/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import type { SiteMetadata } from '../../../src/types/types.d'
import type { Post } from '../../../src/types/types.d'
import {
  BROKEN_LINK_CLASS,
  BROKEN_WIKI_LINK_CLASS,
  INTERNAL_LINK_SELECTOR,
  getWikiLinkCandidates,
  markBrokenLinks,
  resolveInlineWikiTitle
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

describe('markBrokenLinks', () => {
  it('marks unresolved wiki links without changing existing links', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink" href="/existing">Existing</a>
        <a class="clear-wikilink" href="/missing">Missing</a>
      </main>
    `

    markBrokenLinks(siteMetadata, {
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

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })
    markBrokenLinks(siteMetadata, {
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

    expect(() => markBrokenLinks(siteMetadata)).not.toThrow()
    expect(
      document
        .querySelector('.clear-wikilink')
        ?.classList.contains(BROKEN_WIKI_LINK_CLASS)
    ).toBe(false)
  })

  it('replaces link text with canonical title when renderTitle is set', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink" href="/blogs/existing">Alias Text</a>
      </main>
    `

    const posts: Post[] = [
      {
        frontMatter: {
          title: 'Canonical Title',
          date: '2024-01-01',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/existing.html',
        html: '<h1>Canonical Title</h1><p>Content</p>'
      }
    ]

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current',
      renderTitle: 'frontmatter_title',
      allPosts: posts
    })

    const link = document.querySelector<HTMLAnchorElement>(
      'a[href="/blogs/existing"]'
    )
    expect(link?.textContent).toBe('Canonical Title')
  })

  it('keeps original text when renderTitle is alias', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink" href="/blogs/existing">Alias Text</a>
      </main>
    `

    const posts: Post[] = [
      {
        frontMatter: {
          title: 'Canonical Title',
          date: '2024-01-01',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/existing.html',
        html: '<p>Content</p>'
      }
    ]

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current',
      renderTitle: 'alias',
      allPosts: posts
    })

    const link = document.querySelector<HTMLAnchorElement>(
      'a[href="/blogs/existing"]'
    )
    expect(link?.textContent).toBe('Alias Text')
  })
})

describe('resolveInlineWikiTitle', () => {
  const posts: Post[] = [
    {
      frontMatter: {
        title: 'FT Title',
        date: '2024-01-01',
        tags: [],
        description: ''
      },
      regularPath: '/blogs/target.html',
      html: '<h1>Heading Title</h1><p>Content</p>'
    }
  ]

  it('returns null for alias mode', () => {
    expect(resolveInlineWikiTitle('blogs/target', posts, 'alias')).toBeNull()
  })

  it('returns filename for file_name mode', () => {
    expect(resolveInlineWikiTitle('blogs/target', posts, 'file_name')).toBe(
      'target'
    )
  })

  it('returns frontmatter title for frontmatter_title mode', () => {
    expect(
      resolveInlineWikiTitle('blogs/target', posts, 'frontmatter_title')
    ).toBe('FT Title')
  })

  it('returns first heading for first_heading mode', () => {
    expect(resolveInlineWikiTitle('blogs/target', posts, 'first_heading')).toBe(
      'Heading Title'
    )
  })

  it('returns null when post not found', () => {
    expect(
      resolveInlineWikiTitle('blogs/missing', posts, 'frontmatter_title')
    ).toBeNull()
  })

  it('returns null for unknown mode', () => {
    expect(resolveInlineWikiTitle('blogs/target', posts, 'unknown')).toBeNull()
  })

  it('resolves with .md extension in relativePath', () => {
    expect(
      resolveInlineWikiTitle('blogs/target.md', posts, 'frontmatter_title')
    ).toBe('FT Title')
  })

  it('frontmatter_title returns null when matched post has empty title', () => {
    const emptyTitlePosts: Post[] = [
      {
        frontMatter: {
          title: '',
          date: '2024-01-01',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/target.html',
        html: '<p>Content</p>'
      }
    ]
    expect(
      resolveInlineWikiTitle(
        'blogs/target',
        emptyTitlePosts,
        'frontmatter_title'
      )
    ).toBeNull()
  })

  it('first_heading falls back to frontmatter.title when no headings in HTML', () => {
    const noHeadingPosts: Post[] = [
      {
        frontMatter: {
          title: 'Only Title',
          date: '2024-01-01',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/no-heading.html',
        html: '<p>No headings here</p>'
      }
    ]
    expect(
      resolveInlineWikiTitle(
        'blogs/no-heading',
        noHeadingPosts,
        'first_heading'
      )
    ).toBe('Only Title')
  })
})

describe('markBrokenLinks for standard markdown links', () => {
  it('marks broken markdown links with broken-link class', () => {
    document.body.innerHTML = `
      <div class="vp-doc">
        <a href="/existing">Existing Link</a>
        <a href="/missing">Missing Link</a>
      </div>
    `

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })

    const existing = document.querySelector<HTMLAnchorElement>(
      'a[href="/existing"]'
    )
    const missing =
      document.querySelector<HTMLAnchorElement>('a[href="/missing"]')

    expect(existing?.classList.contains(BROKEN_LINK_CLASS)).toBe(false)
    expect(existing?.hasAttribute('data-link-broken')).toBe(false)
    expect(missing?.classList.contains(BROKEN_LINK_CLASS)).toBe(true)
    expect(missing?.getAttribute('data-link-broken')).toBe('')
  })

  it('skips external links', () => {
    document.body.innerHTML = `
      <div class="vp-doc">
        <a href="https://example.com">External</a>
        <a href="mailto:test@test.com">Email</a>
        <a href="#section">Anchor</a>
      </div>
    `

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })

    const external = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com"]'
    )
    const email = document.querySelector<HTMLAnchorElement>(
      'a[href="mailto:test@test.com"]'
    )
    const anchor =
      document.querySelector<HTMLAnchorElement>('a[href="#section"]')

    expect(external?.classList.contains(BROKEN_LINK_CLASS)).toBe(false)
    expect(email?.classList.contains(BROKEN_LINK_CLASS)).toBe(false)
    expect(anchor?.classList.contains(BROKEN_LINK_CLASS)).toBe(false)
  })

  it('replaces markdown link text with canonical title', () => {
    document.body.innerHTML = `
      <div class="vp-doc">
        <a href="/blogs/existing">Old Text</a>
      </div>
    `

    const posts: Post[] = [
      {
        frontMatter: {
          title: 'Post Title',
          date: '2024-01-01',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/existing.html',
        html: '<h1>Post Title</h1><p>Content</p>'
      }
    ]

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current',
      renderTitle: 'frontmatter_title',
      allPosts: posts
    })

    const link = document.querySelector<HTMLAnchorElement>(
      'a[href="/blogs/existing"]'
    )
    expect(link?.textContent).toBe('Post Title')
  })

  it('wiki links still get clear-wikilink--broken class', () => {
    document.body.innerHTML = `
      <div class="vp-doc">
        <a class="clear-wikilink" href="/missing">Wiki Missing</a>
      </div>
    `

    markBrokenLinks(siteMetadata, {
      currentPath: '/blogs/current'
    })

    const link = document.querySelector<HTMLAnchorElement>('a[href="/missing"]')
    expect(link?.classList.contains(BROKEN_WIKI_LINK_CLASS)).toBe(true)
    expect(link?.hasAttribute('data-wikilink-broken')).toBe(true)
    expect(link?.classList.contains(BROKEN_LINK_CLASS)).toBe(false)
  })
})

describe('INTERNAL_LINK_SELECTOR', () => {
  it('matches standard markdown links inside .vp-doc', () => {
    document.body.innerHTML = `
      <div class="vp-doc">
        <a href="/blogs/target">Target</a>
      </div>
    `

    const links = document.querySelectorAll<HTMLAnchorElement>(
      INTERNAL_LINK_SELECTOR
    )
    expect(links.length).toBe(1)
    expect(links[0].getAttribute('href')).toBe('/blogs/target')
  })

  it('matches wiki links outside .vp-doc', () => {
    document.body.innerHTML = `
      <main>
        <a class="clear-wikilink" href="/blogs/target">Target</a>
      </main>
    `

    const links = document.querySelectorAll<HTMLAnchorElement>(
      INTERNAL_LINK_SELECTOR
    )
    expect(links.length).toBe(1)
  })
})
