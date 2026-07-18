import { describe, expect, it, vi } from 'vitest'

import { WEBFONT_DEFAULTS } from '../src/defaults'
import { buildWebfontHead } from '../src/webfont'

const stylesheets = (
  head: [string, Record<string, string>][]
): Record<string, string>[] =>
  head
    .filter(([, attrs]) => attrs.rel === 'stylesheet')
    .map(([, attrs]) => attrs)

const WGHT = WEBFONT_DEFAULTS.weights.join(';')

describe('buildWebfontHead', () => {
  it('returns no entries when fonts or webfont are not configured', () => {
    expect(buildWebfontHead(undefined)).toEqual([])
    expect(buildWebfontHead({})).toEqual([])
    expect(buildWebfontHead({ serif: 'Georgia' })).toEqual([])
    expect(buildWebfontHead({ webfont: [] })).toEqual([])
    expect(buildWebfontHead({ webfont: ['  '] })).toEqual([])
  })

  it('builds a css2 stylesheet URL with automatic weights on the default base', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC']
    })
    const sheets = stylesheets(head)
    expect(sheets).toHaveLength(1)
    expect(sheets[0].href).toBe(
      `${WEBFONT_DEFAULTS.base}/css2?family=Noto+Serif+SC:wght@${WGHT}&display=swap`
    )
  })

  it('emits one stylesheet link per family so failures are isolated', () => {
    const head = buildWebfontHead({
      serif: ['Noto Serif SC'],
      mono: ['Fira Code'],
      webfont: ['Noto Serif SC', 'Fira Code']
    })
    const sheets = stylesheets(head)
    expect(sheets).toHaveLength(2)
    expect(sheets[0].href).toContain(`family=Noto+Serif+SC:wght@${WGHT}`)
    expect(sheets[1].href).toContain(`family=Fira+Code:wght@${WGHT}`)
  })

  it('drops css2 axis syntax from entries with a warning', () => {
    const warn = vi.fn()
    const head = buildWebfontHead(
      { serif: 'Noto Serif SC', webfont: ['Noto Serif SC:wght@200..900'] },
      warn
    )
    const sheets = stylesheets(head)
    expect(sheets[0].href).toContain(`family=Noto+Serif+SC:wght@${WGHT}`)
    expect(sheets[0].href).not.toContain('200..900')
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('axis syntax is not supported')
  })

  it('accepts a single string webfont value', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: 'Noto Serif SC'
    })
    expect(stylesheets(head)[0].href).toContain('family=Noto+Serif+SC')
  })

  it('uses a custom base and strips trailing slashes', () => {
    const head = buildWebfontHead({
      serif: 'Noto Serif SC',
      webfont: ['Noto Serif SC'],
      webfontBase: 'https://example.com/gfonts/'
    })
    expect(stylesheets(head)[0].href).toBe(
      `https://example.com/gfonts/css2?family=Noto+Serif+SC:wght@${WGHT}&display=swap`
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
        webfont: ['Noto Serif SC']
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
