// @vitest-environment node
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { _resetDatetimeConfig } from '../../../src/utils/node/datetime'

const { createContentLoaderMock } = vi.hoisted(() => ({
  createContentLoaderMock: vi.fn(
    (_pattern: string, options: unknown) => options
  )
}))

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}))

vi.mock('vitepress', () => ({
  createContentLoader: createContentLoaderMock
}))

type RawPage = {
  frontmatter: Record<string, unknown>
  url: string
  src?: string
  html?: string
}

type PostsLoader = {
  transform: (rawData: RawPage[]) => unknown[]
}

describe('posts.data', () => {
  beforeEach(() => {
    _resetDatetimeConfig()
    vi.clearAllMocks()
  })

  it('normalizes configured frontmatter fields with spaces into the standard date field', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date", "date created", "date modified"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const posts = loader.transform([
      {
        frontmatter: {
          title: 'Older post without standard date',
          'date created': '2023-12-01',
          tags: ['Blog']
        },
        url: '/blogs/older-post-without-standard-date.html',
        src: '# Older post without standard date',
        html: '<h1>Older post without standard date</h1>'
      },
      {
        frontmatter: {
          title: 'Newer post without standard date',
          'date created': '2024-02-22',
          tags: ['Blog']
        },
        url: '/blogs/newer-post-without-standard-date.html',
        src: '# Newer post without standard date',
        html: '<h1>Newer post without standard date</h1>'
      }
    ]) as Array<{ frontMatter: Record<string, unknown> }>

    expect(posts.map((post) => post.frontMatter.date)).toEqual([
      '2024-02-22',
      '2023-12-01'
    ])
  })

  it('keeps legacy numeric date normalization when datetime config cannot resolve it', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const [post] = loader.transform([
      {
        frontmatter: {
          title: 'Legacy timestamp post',
          date: 1704067200000,
          tags: ['Blog']
        },
        url: '/blogs/legacy-timestamp-post.html'
      }
    ]) as Array<{ frontMatter: Record<string, unknown> }>

    expect(post.frontMatter.date).toBe('2024-01-01')
  })

  it('leaves invalid legacy dates unchanged', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const [post] = loader.transform([
      {
        frontmatter: {
          title: 'Invalid date post',
          date: 'not a date at all',
          tags: ['Blog']
        },
        url: '/blogs/invalid-date-post.html'
      }
    ]) as Array<{ frontMatter: Record<string, unknown> }>

    expect(post.frontMatter.date).toBe('not a date at all')
  })

  it('keeps posts even when they have no publish date', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const posts = loader.transform([
      {
        frontmatter: {
          title: 'Post without metadata'
        },
        url: '/blogs/post-without-metadata.html'
      }
    ]) as Array<{ frontMatter: Record<string, unknown> }>

    // A dateless post is still a post — it is never silently dropped.
    expect(posts).toHaveLength(1)
    expect(posts[0].frontMatter).toEqual({ title: 'Post without metadata' })
  })

  it('matches markdown site-wide so docs-root layouts are discovered', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    // Re-evaluate the module so the createContentLoader call is recorded fresh.
    vi.resetModules()
    await import('../../../src/utils/node/posts.data')

    expect(createContentLoaderMock).toHaveBeenCalledWith(
      '**/*.md',
      expect.objectContaining({ includeSrc: true, render: true })
    )
  })

  it('keeps docs-root and blogs-nested posts, excludes functional pages', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const posts = loader.transform([
      {
        frontmatter: { title: 'Docs-root post', date: '2024-01-02' },
        url: '/example.html'
      },
      {
        frontmatter: { title: 'Nested post', date: '2024-01-01' },
        url: '/blogs/deep/nested.html'
      },
      // Functional/route pages — excluded via flags.
      { frontmatter: { title: 'Tags', page: true }, url: '/tags.html' },
      { frontmatter: { title: 'Home', layout: 'home' }, url: '/index.html' },
      { frontmatter: { title: 'About', article: false }, url: '/about.html' },
      // Reserved-route content (collections/) with no flags — excluded via the
      // reserved route prefix, mirroring NewLayout.vue.
      {
        frontmatter: { title: 'something' },
        url: '/collections/cs/something-1.html'
      }
    ]) as Array<{ frontMatter: Record<string, unknown>; regularPath: string }>

    expect(posts.map((post) => post.regularPath)).toEqual([
      '/example.html',
      '/blogs/deep/nested.html'
    ])
  })
})
