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

  it('handles posts without dates or tags', async () => {
    vi.mocked(readFileSync).mockReturnValue(
      '[datetime]\nfrontmatterFields = ["date"]\nformats = ["YYYY-MM-DD"]'
    )

    const loader = (await import('../../../src/utils/node/posts.data'))
      .default as unknown as PostsLoader
    const [post] = loader.transform([
      {
        frontmatter: {
          title: 'Post without metadata'
        },
        url: '/blogs/post-without-metadata.html'
      }
    ]) as Array<{ frontMatter: Record<string, unknown> }>

    expect(post.frontMatter).toEqual({ title: 'Post without metadata' })
  })
})
