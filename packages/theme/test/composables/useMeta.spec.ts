/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAuthor,
  useDarkTransition,
  useHtmlPreview,
  useTimeFormat,
  useTitle,
  useTruncatedDescription
} from '../../src/composables/useMeta'
import type { PostFrontMatter } from '../../src/types/types.d'

// Mutable mock for useData to allow per-test control
// Capture vue provide calls for useDarkTransition testing
const provideCalls: Map<string, (...args: any[]) => void> = new Map()

const mockIsDark = { value: false }
const mockSite = {
  value: {
    themeConfig: {
      meta: {
        author: 'ConfigAuthor'
      }
    }
  }
}

const { useDataMock } = vi.hoisted(() => ({
  useDataMock: vi.fn(() => ({
    site: mockSite,
    isDark: mockIsDark
  }))
}))

vi.mock('vitepress', () => ({
  useData: useDataMock
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    provide: (key: string, handler: () => void) => {
      provideCalls.set(key, handler)
    }
  }
})

function makeFrontMatter(
  overrides: Partial<PostFrontMatter> = {}
): PostFrontMatter {
  return {
    author: 'PostAuthor',
    date: '2024-06-15',
    title: 'Test Title',
    tags: ['vue'],
    description: 'A test post description',
    ...overrides
  }
}

describe('useTruncatedDescription', () => {
  it('returns empty string for falsy description', () => {
    const result = useTruncatedDescription('')
    expect(result.value).toBe('')
  })

  it('returns empty string for undefined description', () => {
    const result = useTruncatedDescription(undefined as unknown as string)
    expect(result.value).toBe('')
  })

  it('returns full text when under limits', () => {
    const result = useTruncatedDescription('Short')
    expect(result.value).toBe('Short')
  })

  it('truncates Chinese text over default maxChineseChars (42)', () => {
    // Need > 42 Chinese characters
    const longChinese =
      '这是一段非常非常长的中文描述文本专门用于测试截断功能是否可以正常工作需要超过四十二个字的限制条件'.repeat(
        2
      )
    expect(longChinese.length).toBeGreaterThan(42)
    const result = useTruncatedDescription(longChinese)
    expect(result.value.length).toBeLessThan(longChinese.length)
    expect(result.value.endsWith('...')).toBe(true)
  })

  it('truncates English text over maxEnglishWords', () => {
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')
    const result = useTruncatedDescription(words)
    expect(result.value.endsWith('...')).toBe(true)
    expect(result.value.split(' ').length).toBeLessThanOrEqual(31)
  })

  it('respects custom maxChineseChars', () => {
    const text = '这是一段测试中文文本'
    const result = useTruncatedDescription(text, { maxChineseChars: 3 })
    expect(result.value.endsWith('...')).toBe(true)
  })

  it('respects custom maxEnglishWords', () => {
    const words =
      'one two three four five six seven eight nine ten eleven twelve'
    const result = useTruncatedDescription(words, { maxEnglishWords: 5 })
    expect(result.value.endsWith('...')).toBe(true)
  })

  it('does not truncate short English text', () => {
    const result = useTruncatedDescription('Hello world')
    expect(result.value).toBe('Hello world')
  })

  it('does not truncate short Chinese text', () => {
    const result = useTruncatedDescription('你好世界')
    expect(result.value).toBe('你好世界')
  })

  it('handles description with exactly maxChineseChars', () => {
    const text =
      '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二'
    const result = useTruncatedDescription(text, { maxChineseChars: 42 })
    expect(result.value).toBe(text)
  })

  it('returns empty computed for null description', () => {
    const result = useTruncatedDescription(null as unknown as string)
    expect(result.value).toBe('')
  })

  it('options default to sensible values when empty object passed', () => {
    const text = 'Hello world'
    const result = useTruncatedDescription(text, {})
    expect(result.value).toBe('Hello world')
  })

  it('with applyFilters=true does not crash (filters not implemented)', () => {
    const text = 'Some description text here'
    const result = useTruncatedDescription(text, { applyFilters: true })
    expect(typeof result.value).toBe('string')
  })
})

describe('useAuthor', () => {
  beforeEach(() => {
    useDataMock.mockReturnValue({
      site: {
        value: {
          themeConfig: {
            meta: {
              author: 'ConfigAuthor'
            }
          }
        }
      },
      isDark: { value: false }
    })
  })

  it('uses author from frontMatter when set', () => {
    const fm = makeFrontMatter({ author: 'FrontMatterAuthor' })
    expect(useAuthor(fm)).toBe('FrontMatterAuthor')
  })

  it('falls back to config author when frontMatter has no author', () => {
    const fm = makeFrontMatter({ author: undefined as unknown as string })
    expect(useAuthor(fm)).toBe('ConfigAuthor')
  })

  it('falls back to "Blogger" when neither frontMatter nor config has author', () => {
    useDataMock.mockReturnValue({
      site: { value: { themeConfig: {} as any } },
      isDark: { value: false }
    })

    const fm = makeFrontMatter({ author: undefined as unknown as string })
    expect(useAuthor(fm)).toBe('Blogger')
  })

  it('falls back to "Blogger" when meta is missing author', () => {
    useDataMock.mockReturnValue({
      site: { value: { themeConfig: { meta: {} } as any } },
      isDark: { value: false }
    })

    const fm = makeFrontMatter({ author: undefined as unknown as string })
    expect(useAuthor(fm)).toBe('Blogger')
  })

  it('uses frontMatter author even when config author exists', () => {
    const fm = makeFrontMatter({ author: 'OverrideAuthor' })
    expect(useAuthor(fm)).toBe('OverrideAuthor')
  })

  it('handles empty string author in frontMatter as falsy', () => {
    const fm = makeFrontMatter({ author: '' })
    expect(useAuthor(fm)).toBe('ConfigAuthor')
  })
})

describe('useTitle', () => {
  it('returns frontMatter title when set', () => {
    const fm = makeFrontMatter({ title: 'My Post Title' })
    const result = useTitle(fm, '<h1>Different Title</h1>')
    expect(result).toBe('My Post Title')
  })

  it('falls back to first heading from HTML when no frontMatter title', () => {
    const fm = makeFrontMatter({ title: '' })
    const result = useTitle(fm, '<h1>Heading Title</h1>')
    expect(result).toBe('Heading Title')
  })

  it('uses h2 if no h1 present', () => {
    const fm = makeFrontMatter({ title: '' })
    const result = useTitle(fm, '<h2>Second Level</h2>')
    expect(result).toBe('Second Level')
  })

  it('uses first heading among multiple (document order)', () => {
    const fm = makeFrontMatter({ title: '' })
    const html = '<h3>Third Level</h3><h1>First Level</h1>'
    const result = useTitle(fm, html)
    expect(result).toBe('Third Level')
  })

  it('returns empty string when no title and no headings', () => {
    const fm = makeFrontMatter({ title: '' })
    const result = useTitle(fm, '<p>No headings here</p>')
    expect(result).toBe('')
  })

  it('returns empty string for empty HTML', () => {
    const fm = makeFrontMatter({ title: '' })
    const result = useTitle(fm, '')
    expect(result).toBe('')
  })

  it('handles frontMatter with undefined title', () => {
    const fm = makeFrontMatter({ title: undefined as unknown as string })
    const result = useTitle(fm, '<h1>Fallback</h1>')
    expect(result).toBe('Fallback')
  })

  it('returns textContent from heading element including nested children', () => {
    const fm = makeFrontMatter({ title: '' })
    const result = useTitle(fm, '<h1><span>Nested</span> Text</h1>')
    expect(result).toContain('Nested')
    expect(result).toContain('Text')
  })
})

describe('useTimeFormat', () => {
  it('formats YYYY-MM-DD date correctly', () => {
    const result = useTimeFormat('2024-06-15')
    expect(result).toBe('Jun 15, 2024')
  })

  it('returns empty string for invalid date format (DD-MM-YYYY)', () => {
    expect(useTimeFormat('15-06-2024')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(useTimeFormat('')).toBe('')
  })

  it('returns empty string for null/undefined', () => {
    expect(useTimeFormat(null as unknown as string)).toBe('')
    expect(useTimeFormat(undefined as unknown as string)).toBe('')
  })

  it('returns empty string for date with wrong length', () => {
    expect(useTimeFormat('2024-06')).toBe('')
    expect(useTimeFormat('2024-06-15-extra')).toBe('')
  })

  it('returns empty string for date without dashes', () => {
    expect(useTimeFormat('20240615')).toBe('')
  })

  it('returns empty string for completely invalid input', () => {
    expect(useTimeFormat('not-a-date')).toBe('')
  })

  it('formats December correctly', () => {
    const result = useTimeFormat('2024-12-25')
    expect(result).toBe('Dec 25, 2024')
  })

  it('formats January correctly', () => {
    const result = useTimeFormat('2024-01-01')
    expect(result).toBe('Jan 1, 2024')
  })

  it('returns empty string when date components fail validation', () => {
    expect(useTimeFormat('abcd-ef-ghij')).toBe('')
  })

  it('returns empty string for invalid month (13)', () => {
    expect(useTimeFormat('2024-13-01')).toBe('')
  })

  it('returns empty string for invalid day (Feb 30)', () => {
    expect(useTimeFormat('2024-02-30')).toBe('')
  })

  it('returns empty string for invalid date with dashes but non-numeric content', () => {
    expect(useTimeFormat('YYYY-MM-DD')).toBe('')
    expect(useTimeFormat('2024-MM-15')).toBe('')
  })
})

describe('useHtmlPreview', () => {
  it('returns empty string for empty html', () => {
    const preview = useHtmlPreview('')
    expect(preview.value).toBe('')
  })

  it('returns empty string for undefined html', () => {
    const preview = useHtmlPreview(undefined as unknown as string)
    expect(preview.value).toBe('')
  })

  it('extracts first meaningful paragraph content', () => {
    const html =
      '<p>This is a meaningful paragraph with enough text to pass the filter check.</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).toContain('meaningful')
  })

  it('skips paragraphs inside blockquotes', () => {
    const html =
      '<blockquote><p>This should be skipped as it meets the length requirement for filtering.</p></blockquote><p>This should be the preview text with sufficient length for testing.</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).toContain('preview')
  })

  it('skips very short paragraphs (<= 20 chars)', () => {
    const html =
      '<p>Hi</p><p>This is a meaningful paragraph that should be selected.</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).toContain('meaningful')
  })

  it('falls back to list content when no paragraphs', () => {
    const html =
      '<ul><li>First list item with enough content</li><li>Second item</li></ul>'
    const preview = useHtmlPreview(html)
    expect(preview.value.length).toBeGreaterThan(0)
  })

  it('removes headings in fallback mode', () => {
    const html =
      '<h1>Title</h1><p>Some content that is long enough to pass the length check for paragraphs.</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).not.toContain('<h1>')
  })

  it('removes footnote references from output', () => {
    const html =
      '<p>Text with footnote reference and enough additional content to make it meaningful[^1]</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).not.toContain('[^1]')
  })

  it('truncates long Chinese HTML content with ...', () => {
    const chineseText = '这是一段很长的中文内容'.repeat(15)
    const html = `<p>${chineseText}</p>`
    const preview = useHtmlPreview(html, { maxChineseLength: 30 })
    expect(preview.value.endsWith('...')).toBe(true)
  })

  it('truncates long English HTML content with ...', () => {
    const words = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ')
    const html = `<p>${words}</p>`
    const preview = useHtmlPreview(html, { maxEnglishWords: 10 })
    expect(preview.value.endsWith('...')).toBe(true)
  })

  it('respects custom maxChineseLength option', () => {
    const text = '测试中文内容需要截断'
    const html = `<p>${text}</p>`
    const preview = useHtmlPreview(html, { maxChineseLength: 5 })
    expect(preview.value.endsWith('...')).toBe(true)
  })

  it('respects custom maxEnglishWords option', () => {
    const words = 'one two three four five six seven eight nine ten eleven'
    const html = `<p>${words}</p>`
    const preview = useHtmlPreview(html, { maxEnglishWords: 4 })
    expect(preview.value.endsWith('...')).toBe(true)
  })

  it('filters out elements with blog-tag class', () => {
    const html =
      '<p>Real content with enough text to pass the length filter for paragraphs.</p><span class="blog-tag">vue</span>'
    const preview = useHtmlPreview(html)
    expect(preview.value).not.toContain('blog-tag')
    expect(preview.value).not.toContain('vue')
  })

  it('filters out elements with tag class', () => {
    const html =
      '<p>Good content here that is long enough to pass the minimum length requirement for filter checks.</p><span class="tag">typescript</span>'
    const preview = useHtmlPreview(html)
    expect(preview.value).not.toContain('typescript')
  })

  it('filters out elements with vp-tag class', () => {
    const html =
      '<p>Main article text that passes the minimum character count requirement for being a meaningful paragraph.</p><span class="vp-tag">react</span>'
    const preview = useHtmlPreview(html)
    expect(preview.value).not.toContain('react')
  })

  it('handles multiple paragraphs and picks first meaningful one', () => {
    const html =
      '<p>Short</p><p>This is the second paragraph and it should be selected because the first one is too short for the filter.</p><p>Third paragraph ignored</p>'
    const preview = useHtmlPreview(html)
    expect(preview.value).toContain('second')
  })

  it('catch block returns safe substring when DOM parsing fails', () => {
    const original = document.createElement
    document.createElement = (() => {
      throw new Error('DOM unavailable')
    }) as typeof document.createElement

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const preview = useHtmlPreview(
      '<p>Some html content that is longer than the fallback cutoff length for safety</p>'
    )
    expect(preview.value).toBe(
      '<p>Some html content that is longer than the fallback cutoff length for safety</p>...'
    )

    document.createElement = original
    errorSpy.mockRestore()
  })
})

describe('useDarkTransition', () => {
  it('provides toggle-appearance and toggles isDark via simple path', async () => {
    mockIsDark.value = false
    delete (document as any).startViewTransition
    ;(window as any).matchMedia = vi.fn(() => ({ matches: false })) as any
    useDataMock.mockReturnValue({
      site: mockSite,
      isDark: mockIsDark
    })

    useDarkTransition()

    const handler = provideCalls.get('toggle-appearance')
    expect(handler).toBeDefined()

    await handler!({ clientX: 100, clientY: 200 } as any)
    expect(mockIsDark.value).toBe(true)

    provideCalls.clear()
  })

  it('handles startViewTransition path when available', async () => {
    mockIsDark.value = false
    useDataMock.mockReturnValue({
      site: mockSite,
      isDark: mockIsDark
    })

    const viewTransition = { ready: Promise.resolve() }
    ;(document as any).startViewTransition = vi.fn((cb: () => void) => {
      cb()
      return viewTransition
    })
    ;(window as any).matchMedia = vi.fn(() => ({ matches: true })) as any
    ;(document.documentElement as any).animate = vi.fn()

    useDarkTransition()

    const handler = provideCalls.get('toggle-appearance')
    expect(handler).toBeDefined()

    await handler!({ clientX: 0, clientY: 0 } as any)
    expect(mockIsDark.value).toBe(true)

    delete (document as any).startViewTransition
    delete (document.documentElement as any).animate
    provideCalls.clear()
  })

  it('toggles isDark with startViewTransition when isDark is initially true', async () => {
    mockIsDark.value = true
    useDataMock.mockReturnValue({
      site: mockSite,
      isDark: mockIsDark
    })

    const viewTransition = { ready: Promise.resolve() }
    ;(document as any).startViewTransition = vi.fn((cb: () => void) => {
      cb()
      return viewTransition
    })
    ;(window as any).matchMedia = vi.fn(() => ({ matches: true })) as any
    ;(document.documentElement as any).animate = vi.fn()

    useDarkTransition()

    const handler = provideCalls.get('toggle-appearance')
    await handler!({ clientX: 50, clientY: 50 } as any)
    expect(mockIsDark.value).toBe(false)

    delete (document as any).startViewTransition
    delete (document.documentElement as any).animate
    provideCalls.clear()
  })
})
