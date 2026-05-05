/**
 * @vitest-environment jsdom
 */
import mediumZoom from 'medium-zoom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Post, PostFrontMatter } from '../../../src/types/types.d'
import {
  calculateWords,
  initTags,
  mediumZoomInit,
  useMonthYearSort,
  useYearSort
} from '../../../src/utils/client/posts'

vi.mock('medium-zoom', () => {
  const on = vi.fn()
  const off = vi.fn()
  const zoom = vi.fn(() => ({ on, off }))
  return { default: zoom }
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

describe('mediumZoomInit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes medium-zoom on .main img and .mermaid-diagram selectors', () => {
    document.body.innerHTML = `
      <div class="main">
        <img src="test.png" alt="test" />
      </div>
    `
    expect(() => mediumZoomInit()).not.toThrow()
  })

  it('calls mediumZoom with correct selector and options', () => {
    document.body.innerHTML = '<div class="main"><img src="x.png" /></div>'
    mediumZoomInit()
    expect(mediumZoom).toHaveBeenCalledWith(
      '.main img, .mermaid-diagram',
      expect.objectContaining({
        background: 'var(--vp-c-bg)',
        margin: 18,
        scrollOffset: 80
      })
    )
  })

  it('registers open and close handlers', () => {
    document.body.innerHTML = '<div class="main"><img src="x.png" /></div>'
    mediumZoomInit()

    const zoomInstance = (mediumZoom as any).mock.results[0].value
    expect(zoomInstance.on).toHaveBeenCalledWith('open', expect.any(Function))
    expect(zoomInstance.on).toHaveBeenCalledWith('close', expect.any(Function))
  })

  it('sets body overflow to hidden on zoom open', () => {
    document.body.innerHTML = `
      <div class="main"><img src="x.png" /></div>
      <span class="shiki"><span data-language="js">code</span></span>
    `
    mediumZoomInit()

    const zoomInstance = (mediumZoom as any).mock.results[0].value
    // Simulate zoom open
    const openHandler = zoomInstance.on.mock.calls.find(
      (call: any[]) => call[0] === 'open'
    )[1]
    openHandler()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow on zoom close', () => {
    document.body.innerHTML = `
      <div class="main"><img src="x.png" /></div>
      <span class="shiki"><span data-language="js">code</span></span>
    `
    // Set initial state simulating zoom is open
    document.body.style.overflow = 'hidden'

    mediumZoomInit()

    const zoomInstance = (mediumZoom as any).mock.results[0].value
    const closeHandler = zoomInstance.on.mock.calls.find(
      (call: any[]) => call[0] === 'close'
    )[1]
    closeHandler()
    expect(document.body.style.overflow).toBe('')
  })
})
