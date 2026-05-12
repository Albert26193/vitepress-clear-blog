/**
 * @vitest-environment happy-dom
 */
import type { PageLink } from 'vitepress-plugin-analyzer/types'
import { describe, expect, it } from 'vitest'

import type { Post } from '../../../src/types/types'
import {
  getTitleFromPost,
  resolveWikiLinkTitle
} from '../../../src/utils/client/title'

const mockPosts: Post[] = [
  {
    frontMatter: {
      title: 'Frontmatter Title',
      date: '2024-01-01',
      tags: [],
      description: ''
    },
    regularPath: '/blogs/test-target.html',
    html: '<h1>First Heading Title</h1><p>Content</p>'
  },
  {
    frontMatter: {
      title: 'No Heading Post',
      date: '2024-02-01',
      tags: [],
      description: ''
    },
    regularPath: '/blogs/no-heading.html',
    html: '<p>No headings here</p>'
  },
  {
    frontMatter: {
      title: '',
      date: '2024-03-01',
      tags: [],
      description: ''
    },
    regularPath: '/blogs/no-title.html',
    html: '<h1>Heading Fallback</h1><p>Content</p>'
  }
]

const mockLink: PageLink = {
  absolutePath: '/abs/blogs/test-target.md',
  text: 'Alias Text',
  relativePath: 'blogs/test-target',
  fullUrl: '/blogs/test-target',
  type: 'wiki',
  raw: '[[test-target|Alias Text]]'
}

describe('resolveWikiLinkTitle', () => {
  it('file_name mode returns filename from relativePath', () => {
    expect(resolveWikiLinkTitle(mockLink, mockPosts, 'file_name')).toBe(
      'test-target'
    )
  })

  it('file_name mode strips .md extension', () => {
    const linkWithExt = { ...mockLink, relativePath: 'blogs/target.md' }
    expect(resolveWikiLinkTitle(linkWithExt, mockPosts, 'file_name')).toBe(
      'target'
    )
  })

  it('alias mode returns link text verbatim', () => {
    expect(resolveWikiLinkTitle(mockLink, mockPosts, 'alias')).toBe(
      'Alias Text'
    )
  })

  it('alias mode falls back to empty string when text is empty', () => {
    const noText = { ...mockLink, text: '' }
    expect(resolveWikiLinkTitle(noText, mockPosts, 'alias')).toBe('')
  })

  it('frontmatter_title mode returns frontmatter.title', () => {
    expect(resolveWikiLinkTitle(mockLink, mockPosts, 'frontmatter_title')).toBe(
      'Frontmatter Title'
    )
  })

  it('frontmatter_title falls back to link.text when post not found', () => {
    const unknownLink = { ...mockLink, relativePath: 'blogs/nonexistent' }
    expect(
      resolveWikiLinkTitle(unknownLink, mockPosts, 'frontmatter_title')
    ).toBe('Alias Text')
  })

  it('frontmatter_title returns fullUrl basename when post not found and text empty', () => {
    const link = { ...mockLink, text: '', relativePath: 'blogs/ghost' }
    expect(resolveWikiLinkTitle(link, mockPosts, 'frontmatter_title')).toBe(
      'test-target'
    )
  })

  it('frontmatter_title falls back to filename when post has no title', () => {
    const noTitleLink = { ...mockLink, relativePath: 'blogs/no-title' }
    expect(
      resolveWikiLinkTitle(noTitleLink, mockPosts, 'frontmatter_title')
    ).toBe('no-title')
  })

  it('first_heading mode returns first h1 from rendered html', () => {
    expect(resolveWikiLinkTitle(mockLink, mockPosts, 'first_heading')).toBe(
      'First Heading Title'
    )
  })

  it('first_heading falls back to frontmatter.title when no headings', () => {
    const noHeadingLink = { ...mockLink, relativePath: 'blogs/no-heading' }
    expect(
      resolveWikiLinkTitle(noHeadingLink, mockPosts, 'first_heading')
    ).toBe('No Heading Post')
  })

  it('first_heading falls back to heading when post has no title', () => {
    const noTitleLink = { ...mockLink, relativePath: 'blogs/no-title' }
    expect(resolveWikiLinkTitle(noTitleLink, mockPosts, 'first_heading')).toBe(
      'Heading Fallback'
    )
  })

  it('default unknown mode returns link.text', () => {
    expect(resolveWikiLinkTitle(mockLink, mockPosts, 'unknown_mode')).toBe(
      'Alias Text'
    )
  })
})

describe('resolveWikiLinkTitle edge cases', () => {
  it('alias returns empty when both text and matched post missing', () => {
    const link: PageLink = {
      absolutePath: '',
      text: '',
      relativePath: 'blogs/ghost',
      fullUrl: '/blogs/ghost',
      type: 'wiki',
      raw: '[[ghost]]'
    }
    expect(resolveWikiLinkTitle(link, [], 'alias')).toBe('')
  })

  it('file_name returns text fallback when relativePath has no segments', () => {
    const link: PageLink = {
      absolutePath: '',
      text: 'fallback',
      relativePath: '',
      fullUrl: '/',
      type: 'wiki',
      raw: '[[/]]'
    }
    const result = resolveWikiLinkTitle(link, [], 'file_name')
    expect(result).toBe('fallback')
  })

  it('frontmatter_title falls back through chain when post not matched', () => {
    const link: PageLink = {
      absolutePath: '',
      text: 'alias',
      relativePath: 'blogs/nope',
      fullUrl: '/blogs/nope',
      type: 'wiki',
      raw: '[[nope]]'
    }
    // Post not found, should fallback to link.text
    expect(resolveWikiLinkTitle(link, mockPosts, 'frontmatter_title')).toBe(
      'alias'
    )
  })

  it('first_heading falls back to filename when post has no title or headings', () => {
    const posts: Post[] = [
      {
        frontMatter: { title: '', date: '', tags: [], description: '' },
        regularPath: '/blogs/empty.html',
        html: '<p>Just text</p>'
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: '',
      relativePath: 'blogs/empty',
      fullUrl: '/blogs/empty',
      type: 'wiki',
      raw: '[[empty]]'
    }
    // No title, no headings -> falls back to filename
    expect(resolveWikiLinkTitle(link, posts, 'first_heading')).toBe('empty')
  })

  it('frontmatter_title works with .md extension in relativePath', () => {
    const mdLink = { ...mockLink, relativePath: 'blogs/test-target.md' }
    expect(resolveWikiLinkTitle(mdLink, mockPosts, 'frontmatter_title')).toBe(
      'Frontmatter Title'
    )
  })

  it('first_heading works with .md extension in relativePath', () => {
    const mdLink = { ...mockLink, relativePath: 'blogs/test-target.md' }
    expect(resolveWikiLinkTitle(mdLink, mockPosts, 'first_heading')).toBe(
      'First Heading Title'
    )
  })

  it('default mode returns fullUrl basename when link.text is empty', () => {
    const noTextLink = { ...mockLink, text: '' }
    expect(resolveWikiLinkTitle(noTextLink, mockPosts, 'unknown')).toBe(
      'test-target'
    )
  })
})

describe('getTitleFromPost', () => {
  it('returns link.text when allPosts is empty', () => {
    const link: PageLink = {
      absolutePath: '',
      text: 'My Text',
      relativePath: 'blogs/post',
      fullUrl: '/blogs/post',
      type: 'wiki',
      raw: '[[post|My Text]]'
    }

    expect(getTitleFromPost(link, null as any)).toBe('My Text')
  })

  it('returns fullUrl basename when allPosts is null and link.text is empty', () => {
    const link: PageLink = {
      absolutePath: '',
      text: '',
      relativePath: 'blogs/post',
      fullUrl: '/blogs/post',
      type: 'wiki',
      raw: '[[post]]'
    }
    expect(getTitleFromPost(link, null as any)).toBe('post')
  })

  it('returns filename when no post matched and no link.text', () => {
    const link: PageLink = {
      absolutePath: '',
      text: '',
      relativePath: 'blogs/ghost',
      fullUrl: '/blogs/ghost',
      type: 'wiki',
      raw: '[[ghost]]'
    }
    expect(getTitleFromPost(link, [])).toBe('ghost')
  })
})

describe('getTitleFromPost extended', () => {
  it('returns title from matched post using useTitle', () => {
    const posts: Post[] = [
      {
        frontMatter: {
          title: 'Post Title',
          date: '',
          tags: [],
          description: ''
        },
        regularPath: '/blogs/my-post.html',
        html: '<h1>Heading</h1>'
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: 'alias',
      relativePath: 'blogs/my-post',
      fullUrl: '/blogs/my-post',
      type: 'wiki',
      raw: '[[my-post|alias]]'
    }
    expect(getTitleFromPost(link, posts)).toBe('Post Title')
  })

  it('returns heading when frontmatter has no title', () => {
    const posts: Post[] = [
      {
        frontMatter: { title: '', date: '', tags: [], description: '' },
        regularPath: '/blogs/my-post.html',
        html: '<h1>Heading Text</h1>'
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: 'alias',
      relativePath: 'blogs/my-post',
      fullUrl: '/blogs/my-post',
      type: 'wiki',
      raw: '[[my-post|alias]]'
    }
    expect(getTitleFromPost(link, posts)).toBe('Heading Text')
  })

  it('handles relativePath with .md extension', () => {
    const posts: Post[] = [
      {
        frontMatter: { title: 'MD Post', date: '', tags: [], description: '' },
        regularPath: '/blogs/my-post.html',
        html: '<h1>Heading</h1>'
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: 'alias',
      relativePath: 'blogs/my-post.md',
      fullUrl: '/blogs/my-post',
      type: 'wiki',
      raw: '[[my-post.md|alias]]'
    }
    expect(getTitleFromPost(link, posts)).toBe('MD Post')
  })

  it('falls back to filename when matched post has empty title and no heading', () => {
    const posts: Post[] = [
      {
        frontMatter: { title: '', date: '', tags: [], description: '' },
        regularPath: '/blogs/my-post.html',
        html: ''
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: '',
      relativePath: 'blogs/my-post',
      fullUrl: '/blogs/my-post',
      type: 'wiki',
      raw: '[[my-post]]'
    }
    expect(getTitleFromPost(link, posts)).toBe('my-post')
  })

  it('uses link.text when no posts match', () => {
    const posts: Post[] = [
      {
        frontMatter: { title: 'Other', date: '', tags: [], description: '' },
        regularPath: '/blogs/other.html',
        html: ''
      }
    ]
    const link: PageLink = {
      absolutePath: '',
      text: 'my text',
      relativePath: 'blogs/my-post',
      fullUrl: '/blogs/my-post',
      type: 'wiki',
      raw: '[[my-post|my text]]'
    }
    expect(getTitleFromPost(link, posts)).toBe('my text')
  })
})
