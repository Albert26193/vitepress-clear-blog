/**
 * @vitest-environment happy-dom
 */
import type { PageLink } from 'vitepress-plugin-analyzer/types'
import { describe, expect, it } from 'vitest'

import type { Post, PostFrontMatter } from '../../../src/types/types.d'
import { getTitleFromPost } from '../../../src/utils/client/title'

function makePost(
  date: string,
  title: string,
  html: string,
  regularPath: string = '/posts/test.html'
): Post {
  return {
    frontMatter: {
      date,
      title,
      tags: [],
      description: ''
    } as PostFrontMatter,
    regularPath,
    html
  }
}

function makePageLink(overrides: Partial<PageLink> = {}): PageLink {
  return {
    text: 'Link Text',
    relativePath: 'blogs/tech/something.md',
    fullUrl: '/blogs/tech/something',
    absolutePath: '/src/blogs/tech/something.md',
    type: 'markdown',
    raw: '/blogs/tech/something',
    ...overrides
  }
}

describe('getTitleFromPost', () => {
  it('returns link text when allPosts is null', () => {
    const link = makePageLink()
    const result = getTitleFromPost(link, null as unknown as Post[])
    expect(result).toBe('Link Text')
  })

  it('returns link text when allPosts is undefined', () => {
    const link = makePageLink()
    const result = getTitleFromPost(link, undefined as unknown as Post[])
    expect(result).toBe('Link Text')
  })

  it('returns extracted filename when allPosts null and no link text', () => {
    const link = makePageLink({
      text: '',
      relativePath: 'blogs/tech/something.md',
      fullUrl: '/blogs/tech/something'
    })
    const result = getTitleFromPost(link, null as unknown as Post[])
    expect(result).toBe('something')
  })

  it('returns link text when no matching post found', () => {
    const posts = [
      makePost('2024-01-01', 'Post Title', '<h1>Post</h1>', '/other.html')
    ]
    const link = makePageLink()
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('Link Text')
  })

  it('returns title from matched post frontMatter (no html headings)', () => {
    const posts = [
      makePost(
        '2024-01-01',
        'Frontmatter Title',
        '',
        '/blogs/tech/something.html'
      )
    ]
    const link = makePageLink({ relativePath: 'blogs/tech/something.md' })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('Frontmatter Title')
  })

  it('returns fallback when no match and no link text', () => {
    const posts: Post[] = []
    const link = makePageLink({ text: '' })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('something')
  })

  it('handles relativePath without .md extension', () => {
    const posts = [
      makePost('2024-01-01', 'No Ext Title', '', '/blogs/tech/plain.html')
    ]
    const link = makePageLink({ relativePath: 'blogs/tech/plain' })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('No Ext Title')
  })

  it('falls back to regularPath extraction when frontMatter title empty', () => {
    const posts = [
      {
        frontMatter: {
          date: '2024-01-01',
          title: '',
          tags: [],
          description: ''
        } as PostFrontMatter,
        regularPath: '/blogs/tech/from-path.html',
        html: ''
      } as Post
    ]
    const link = makePageLink({ relativePath: 'blogs/tech/from-path.md' })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('from-path')
  })

  it('matches post by converting .md to .html in regularPath', () => {
    const posts = [
      makePost(
        '2024-01-01',
        'Correct',
        '<h1>Title</h1>',
        '/blogs/tech/correct.html'
      )
    ]
    const link = makePageLink({
      relativePath: 'blogs/tech/correct.md',
      fullUrl: '/blogs/tech/correct'
    })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('Correct')
  })

  it('handles deep nested paths', () => {
    const posts = [makePost('2024-01-01', 'Deep', '', '/a/b/c/d/post.html')]
    const link = makePageLink({ relativePath: 'a/b/c/d/post.md' })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('Deep')
  })

  it('falls back to filename from regularPath when matched post has empty title and no html', () => {
    const posts = [
      {
        frontMatter: {
          date: '2024-01-01',
          title: '',
          tags: [],
          description: ''
        } as PostFrontMatter,
        regularPath: '/blogs/tech/from-regular.html',
        html: undefined as unknown as string
      } as Post
    ]
    const link = makePageLink({
      relativePath: 'blogs/tech/from-regular.md',
      text: ''
    })
    const result = getTitleFromPost(link, posts)
    expect(result).toBe('from-regular')
  })

  it('fullUrl fallback when link text and path extraction both fail', () => {
    const link = makePageLink({
      text: '',
      fullUrl: '/blog/post-name'
    })
    const result = getTitleFromPost(link, undefined as unknown as Post[])
    expect(result).toBe('post-name')
  })

  it('returns empty string when all fallbacks fail with empty allPosts', () => {
    const link = makePageLink({
      text: '',
      fullUrl: ''
    })
    const result = getTitleFromPost(link, [])
    expect(result).toBe('')
  })
})
