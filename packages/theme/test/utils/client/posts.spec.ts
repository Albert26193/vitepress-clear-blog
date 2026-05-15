/**
 * @vitest-environment jsdom
 */
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Post, PostFrontMatter } from '../../../src/types/types.d'
import {
  calculateWords,
  initTags,
  photoSwipeInit,
  useMonthYearSort,
  useYearSort
} from '../../../src/utils/client/posts'

const mockAddFilter = vi.fn()
const mockOn = vi.fn()
const mockInit = vi.fn()
const mockDestroy = vi.fn()

vi.mock('photoswipe/lightbox', () => {
  const lightbox = vi.fn(function PhotoSwipeLightboxMock() {
    return {
      addFilter: mockAddFilter,
      on: mockOn,
      init: mockInit,
      destroy: mockDestroy
    }
  })
  return { default: lightbox }
})

function makePost(date: string, tags: string[], content: string = ''): Post {
  return {
    frontMatter: {
      date,
      title: `Post ${date}`,
      tags,
      description: ''
    } as PostFrontMatter,
    regularPath: `/posts/${date.replace(/-/g, '/')}/post.html`,
    rawContent: content
  }
}

describe('initTags', () => {
  it('returns empty object for empty posts array', () => {
    expect(initTags([])).toEqual({})
  })

  it('returns empty object for posts with no tags', () => {
    const posts = [makePost('2024-01-01', [])]
    expect(initTags(posts)).toEqual({})
  })

  it('groups posts by single tag', () => {
    const post = makePost('2024-01-01', ['vue'])
    const result = initTags([post])
    expect(result).toEqual({ vue: [post] })
  })

  it('groups posts by multiple tags', () => {
    const posts = [
      makePost('2024-01-01', ['vue', 'typescript']),
      makePost('2024-01-02', ['vue']),
      makePost('2024-01-03', ['typescript', 'css'])
    ]
    const result = initTags(posts)
    expect(result['vue']).toHaveLength(2)
    expect(result['typescript']).toHaveLength(2)
    expect(result['css']).toHaveLength(1)
  })

  it('handles duplicate tags on same post', () => {
    const post = makePost('2024-01-01', ['vue', 'vue'])
    const result = initTags([post])
    expect(result['vue']).toHaveLength(2)
  })

  it('preserves original post objects in tag groups', () => {
    const post = makePost('2024-01-01', ['rust'])
    const result = initTags([post])
    expect(result['rust'][0]).toBe(post)
  })

  it('handles posts with undefined tags', () => {
    const post: Post = {
      frontMatter: {
        date: '2024-01-01',
        title: 'No Tags',
        tags: undefined as unknown as string[],
        description: ''
      },
      regularPath: '/posts/no-tags.html'
    }
    const result = initTags([post])
    expect(result).toEqual({})
  })

  it('handles posts with tags array containing empty string', () => {
    const post = makePost('2024-01-01', [''])
    const result = initTags([post])
    expect(result['']).toHaveLength(1)
  })
})

describe('useYearSort', () => {
  it('returns empty array for null/undefined input', () => {
    expect(useYearSort(null as unknown as Post[])).toEqual([])
    expect(useYearSort(undefined as unknown as Post[])).toEqual([])
  })

  it('returns empty array for empty posts', () => {
    expect(useYearSort([])).toEqual([])
  })

  it('groups posts by year in descending order', () => {
    const posts = [
      makePost('2024-01-01', []),
      makePost('2023-06-15', []),
      makePost('2024-03-20', []),
      makePost('2022-12-31', [])
    ]
    const result = useYearSort(posts)
    expect(result).toHaveLength(3)
    expect(result[0][0].frontMatter.date).toBe('2024-01-01')
    expect(result[0][1].frontMatter.date).toBe('2024-03-20')
    expect(result[1][0].frontMatter.date).toBe('2023-06-15')
    expect(result[2][0].frontMatter.date).toBe('2022-12-31')
  })

  it('handles posts with no date', () => {
    const post: Post = {
      frontMatter: {
        date: '' as unknown as string,
        title: 'No Date',
        tags: [],
        description: ''
      },
      regularPath: '/no-date.html'
    }
    const result = useYearSort([post])
    expect(result).toEqual([])
  })

  it('handles posts with missing frontMatter date', () => {
    const post: Post = {
      frontMatter: {
        date: undefined as unknown as string,
        title: 'Undefined Date',
        tags: [],
        description: ''
      },
      regularPath: '/undefined-date.html'
    }
    const result = useYearSort([post])
    expect(result).toEqual([])
  })

  it('handles multiple posts in same year', () => {
    const posts = [
      makePost('2024-06-01', []),
      makePost('2024-01-01', []),
      makePost('2024-12-31', [])
    ]
    const result = useYearSort(posts)
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(3)
  })
})

describe('useMonthYearSort', () => {
  it('returns empty object for null/undefined input', () => {
    expect(useMonthYearSort(null as unknown as Post[])).toEqual({})
    expect(useMonthYearSort(undefined as unknown as Post[])).toEqual({})
  })

  it('returns empty object for empty posts', () => {
    expect(useMonthYearSort([])).toEqual({})
  })

  it('groups posts by year and month', () => {
    const posts = [
      makePost('2024-01-15', []),
      makePost('2024-01-20', []),
      makePost('2024-02-01', []),
      makePost('2023-01-01', [])
    ]
    const result = useMonthYearSort(posts)
    expect(Object.keys(result)).toHaveLength(2)
    expect(Object.keys(result['2024'])).toHaveLength(2)
    expect(result['2024']['01']).toHaveLength(2)
    expect(result['2024']['02']).toHaveLength(1)
    expect(result['2023']['01']).toHaveLength(1)
  })

  it('handles posts with missing date', () => {
    const post: Post = {
      frontMatter: {
        date: undefined as unknown as string,
        title: 'No Date',
        tags: [],
        description: ''
      },
      regularPath: '/no-date.html'
    }
    const result = useMonthYearSort([post])
    expect(result).toEqual({})
  })

  it('handles posts with empty date string', () => {
    const post = makePost('', [])
    const result = useMonthYearSort([post])
    expect(result).toEqual({})
  })

  it('preserves descending post order within same month when input is newest-first', () => {
    const posts = [
      makePost('2024-03-20', []),
      makePost('2024-03-10', []),
      makePost('2024-03-05', [])
    ]
    const result = useMonthYearSort(posts)
    const monthPosts = result['2024']['03']
    expect(monthPosts[0].frontMatter.date).toBe('2024-03-20')
    expect(monthPosts[1].frontMatter.date).toBe('2024-03-10')
    expect(monthPosts[2].frontMatter.date).toBe('2024-03-05')
  })

  it('preserves ascending post order within same month when input is oldest-first', () => {
    const posts = [
      makePost('2024-03-05', []),
      makePost('2024-03-10', []),
      makePost('2024-03-20', [])
    ]
    const result = useMonthYearSort(posts)
    const monthPosts = result['2024']['03']
    expect(monthPosts[0].frontMatter.date).toBe('2024-03-05')
    expect(monthPosts[1].frontMatter.date).toBe('2024-03-10')
    expect(monthPosts[2].frontMatter.date).toBe('2024-03-20')
  })

  it('preserves key insertion order matching input order for month keys', () => {
    // When posts are fed newest-first, months within a year appear in insertion order
    const posts = [
      makePost('2024-12-25', []),
      makePost('2024-03-10', []),
      makePost('2024-01-01', [])
    ]
    const result = useMonthYearSort(posts)
    const monthKeys = Object.keys(result['2024'])
    // Months appear in the order they were first encountered
    expect(monthKeys[0]).toBe('12')
    expect(monthKeys[1]).toBe('03')
    expect(monthKeys[2]).toBe('01')
  })
})

describe('calculateWords', () => {
  it('returns 0 for empty string', () => {
    expect(calculateWords('')).toBe(0)
  })

  it('returns 0 for whitespace-only content', () => {
    expect(calculateWords('   ')).toBe(0)
  })

  it('counts English words', () => {
    expect(calculateWords('hello world')).toBe(2)
  })

  it('counts Chinese characters individually', () => {
    expect(calculateWords('你好世界')).toBe(4)
  })

  it('handles mixed Chinese and English content', () => {
    const text = 'This is a test 这是一个测试 hello'
    const count = calculateWords(text)
    expect(count).toBe(11)
  })

  it('counts numbers as part of words', () => {
    expect(calculateWords('hello123 world456')).toBe(2)
  })

  it('handles punctuation', () => {
    const count = calculateWords('hello, world! How are you?')
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('counts alphanumeric and underscore sequences as single words', () => {
    expect(calculateWords('hello_world test_var')).toBe(2)
  })

  it('handles CJK punctuation separately from words', () => {
    const text = '你好。世界！'
    expect(calculateWords(text)).toBe(4)
  })

  it('handles Korean characters', () => {
    expect(calculateWords('안녕하세요')).toBe(5)
  })

  it('returns 0 for whitespace-only string', () => {
    expect(calculateWords(' \n \t ')).toBe(0)
  })
})

describe('photoSwipeInit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
    document.body.innerHTML = ''
  })

  const getRegisteredFilter = () => {
    const call = mockAddFilter.mock.calls.find(
      (args) => args[0] === 'domItemData'
    )
    return call?.[1] as
      | ((itemData: any, element: HTMLElement) => any)
      | undefined
  }

  const getRegisteredHandler = (eventName: string) => {
    const call = mockOn.mock.calls.find((args) => args[0] === eventName)
    return call?.[1] as (() => void) | undefined
  }

  it('initializes PhotoSwipe on article images', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="test.png" alt="test" />
      </div>
    `

    expect(() => photoSwipeInit()).not.toThrow()
    expect(PhotoSwipeLightbox).toHaveBeenCalledWith(
      expect.objectContaining({
        gallery: 'body',
        children: '.main img',
        pswpModule: expect.any(Function)
      })
    )
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('registers PhotoSwipe item data and lifecycle handlers', () => {
    photoSwipeInit()

    expect(mockAddFilter).toHaveBeenCalledWith(
      'domItemData',
      expect.any(Function)
    )
    expect(mockOn).toHaveBeenCalledWith('beforeOpen', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('close', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('destroy', expect.any(Function))
  })

  it('maps image elements to PhotoSwipe item data', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="test.png" alt="test image" width="640" height="360" />
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('img') as HTMLImageElement
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      src: expect.stringContaining('test.png'),
      msrc: expect.stringContaining('test.png'),
      width: 640,
      height: 360,
      alt: 'test image'
    })
  })

  it('uses rendered image dimensions when natural and attribute dimensions are missing', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="test.png" alt="test image" />
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('img') as HTMLImageElement
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
      width: 320,
      height: 180,
      x: 0,
      y: 0,
      top: 0,
      right: 320,
      bottom: 180,
      left: 0,
      toJSON: () => ({})
    })
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      width: 320,
      height: 180
    })
  })

  it('falls back to one pixel dimensions when the image has no measurable size', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="test.png" alt="test image" />
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('img') as HTMLImageElement
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      width: 1,
      height: 1
    })
  })

  it('maps Mermaid image output to PhotoSwipe item data using attribute dimensions', () => {
    document.body.innerHTML = `
      <div class="main">
        <div class="mermaid-diagram">
          <img class="mermaid-img" src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" alt="Mermaid diagram" width="800" height="400" />
        </div>
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('.mermaid-img') as HTMLImageElement
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      top: 0,
      right: 100,
      bottom: 50,
      left: 0,
      toJSON: () => ({})
    })
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      src: expect.stringContaining('data:image/svg+xml'),
      msrc: expect.stringContaining('data:image/svg+xml'),
      width: 800,
      height: 400,
      secondaryZoomLevel: 2,
      alt: 'Mermaid diagram'
    })
  })

  it('uses rendered size for SVG when larger than viewBox dimensions', () => {
    document.body.innerHTML = `
      <div class="main">
        <div class="mermaid-diagram">
          <img class="mermaid-img" src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" alt="Mermaid diagram" width="111" height="174" />
        </div>
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('.mermaid-img') as HTMLImageElement
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
      width: 600,
      height: 400,
      x: 0,
      y: 0,
      top: 0,
      right: 600,
      bottom: 400,
      left: 0,
      toJSON: () => ({})
    })
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      src: expect.stringContaining('data:image/svg+xml'),
      msrc: expect.stringContaining('data:image/svg+xml'),
      width: 600,
      height: 400,
      secondaryZoomLevel: 2,
      alt: 'Mermaid diagram'
    })
  })

  it('uses rendered size for linked SVG images', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="/diagram.SVG?version=1#graph" alt="SVG diagram" width="120" height="80" />
      </div>
    `
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const image = document.querySelector('img') as HTMLImageElement
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
      width: 480,
      height: 320,
      x: 0,
      y: 0,
      top: 0,
      right: 480,
      bottom: 320,
      left: 0,
      toJSON: () => ({})
    })
    const itemData = filter?.({}, image)

    expect(itemData).toMatchObject({
      src: expect.stringContaining('/diagram.SVG'),
      msrc: expect.stringContaining('/diagram.SVG'),
      width: 480,
      height: 320,
      secondaryZoomLevel: 2,
      alt: 'SVG diagram'
    })
  })

  it('keeps existing item data for non-image elements and images without a source', () => {
    photoSwipeInit()

    const filter = getRegisteredFilter()
    const originalItemData = { html: '<p>custom</p>' }
    expect(filter?.(originalItemData, document.createElement('div'))).toBe(
      originalItemData
    )

    const image = document.createElement('img')
    expect(filter?.(originalItemData, image)).toBe(originalItemData)
  })

  it('uses a lazy PhotoSwipe module import', async () => {
    photoSwipeInit()

    const options = vi.mocked(PhotoSwipeLightbox).mock.calls.at(-1)?.[0] as {
      pswpModule: () => Promise<unknown>
    }
    await expect(options.pswpModule()).resolves.toBeDefined()
  })

  it('sets body overflow and hides code labels before opening', () => {
    document.body.innerHTML = `
      <div class="main"><img src="x.png" /></div>
      <span class="shiki"><span data-language="js">code</span></span>
    `
    photoSwipeInit()

    getRegisteredHandler('beforeOpen')?.()

    expect(document.body.style.overflow).toBe('hidden')
    expect(
      (document.querySelector('[data-language]') as HTMLElement).style.display
    ).toBe('none')
  })

  it('restores body overflow and code labels on close', () => {
    document.body.innerHTML = `
      <div class="main"><img src="x.png" /></div>
      <span class="shiki"><span data-language="js" style="display: none">code</span></span>
    `
    document.body.style.overflow = 'hidden'
    photoSwipeInit()

    getRegisteredHandler('close')?.()

    expect(document.body.style.overflow).toBe('')
    expect(
      (document.querySelector('[data-language]') as HTMLElement).style.display
    ).toBe('')
  })

  it('destroys previous PhotoSwipe instance when reinitializing', () => {
    photoSwipeInit()
    const destroyCallsAfterFirstInit = mockDestroy.mock.calls.length

    photoSwipeInit()

    expect(mockDestroy.mock.calls.length).toBe(destroyCallsAfterFirstInit + 1)
    expect(PhotoSwipeLightbox).toHaveBeenCalledTimes(2)
  })
})
