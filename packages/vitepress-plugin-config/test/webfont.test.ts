import { describe, expect, it, vi } from 'vitest'

import { WEBFONT_DEFAULTS } from '../src/defaults'
import { buildWebfontHead } from '../src/webfont'

const stylesheetHref = (head: [string, Record<string, string>][]): string => {
  const entry = head.find(([, attrs]) => attrs.rel === 'stylesheet')
  expect(entry).toBeDefined()
  return entry![1].href
}

describe('buildWebfontHead', () => {
  it('returns no entries when fonts or webfont are not configured', () => {
    expect(buildWebfontHead(undefined)).toEqual([])
    expect(buildWebfontHead({})).toEqual([])
    expect(buildWebfontHead({ serif: 'Georgia' })).toEqual([])
    expect(buildWebfontHead({ webfont: [] })).toEqual([])
    expect(buildWebfontHead({ webfont: ['  '] })).toEqual([])
  })

  it('builds a css2 stylesheet URL on the default mirror base', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC']
    })
    expect(stylesheetHref(head)).toBe(
      `${WEBFONT_DEFAULTS.base}/css2?family=Noto+Serif+SC&display=swap`
    )
  })

  it('joins multiple families into a single request', () => {
    const head = buildWebfontHead({
      serif: ['Noto Serif SC'],
      mono: ['Fira Code'],
      webfont: ['Noto Serif SC', 'Fira Code']
    })
    expect(stylesheetHref(head)).toContain(
      'css2?family=Noto+Serif+SC&family=Fira+Code&display=swap'
    )
  })

  it('passes an axis suffix through verbatim', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC:wght@400;700']
    })
    expect(stylesheetHref(head)).toContain(
      'family=Noto+Serif+SC:wght@400;700&display=swap'
    )
  })

  it('accepts a single string webfont value', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: 'Noto Serif SC'
    })
    expect(stylesheetHref(head)).toContain('family=Noto+Serif+SC')
  })

  it('uses a custom base and strips trailing slashes', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC'],
      webfontBase: 'https://example.com/gfonts/'
    })
    expect(stylesheetHref(head)).toBe(
      'https://example.com/gfonts/css2?family=Noto+Serif+SC&display=swap'
    )
  })

  it('emits preconnect entries for the base origin', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC']
    })
    expect(head[0]).toEqual([
      'link',
      { rel: 'preconnect', href: WEBFONT_DEFAULTS.base }
    ])
    expect(head[1]).toEqual([
      'link',
      { rel: 'preconnect', href: WEBFONT_DEFAULTS.base, crossorigin: '' }
    ])
  })

  it('preconnects to gstatic when using the official Google origin', () => {
    const head = buildWebfontHead({
      sans: 'Noto Sans SC',
      webfont: ['Noto Sans SC'],
      webfontBase: 'https://fonts.googleapis.com'
    })
    expect(head[1]).toEqual([
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: ''
      }
    ])
  })

  it('warns when a webfont family is missing from every stack', () => {
    const warn = vi.fn()
    buildWebfontHead({ serif: 'Georgia', webfont: ['Noto Serif SC'] }, warn)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('Noto Serif SC')
  })

  it('does not warn when the family appears in a stack (quotes/case tolerant)', () => {
    const warn = vi.fn()
    buildWebfontHead(
      {
        serif: ["'noto serif sc'", 'Georgia'],
        webfont: ['Noto Serif SC:wght@400;700']
      },
      warn
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn when no stack is configured at all', () => {
    const warn = vi.fn()
    buildWebfontHead({ webfont: ['Noto Serif SC'] }, warn)
    expect(warn).not.toHaveBeenCalled()
  })
})
