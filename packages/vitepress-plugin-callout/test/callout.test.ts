import MarkdownIt from 'markdown-it'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calloutPlugin } from '../src/node/callout'
import type { CalloutPluginOptions } from '../src/node/callout'

const render = (md: MarkdownIt, src: string) =>
  md.render(src).replace(/\n$/, '')

describe('calloutPlugin — custom types', () => {
  let md: MarkdownIt

  beforeEach(() => {
    md = new MarkdownIt()
  })

  it('renders custom callout with uppercase type as default title', () => {
    md.use(calloutPlugin)
    const html = render(md, '> [!question]\n> What is this?')
    expect(html).toContain('class="question custom-block custom-callout"')
    expect(html).toContain('QUESTION')
    expect(html).toContain('What is this?')
  })

  it('uses configured title for custom type', () => {
    const opts: CalloutPluginOptions = {
      types: { question: { title: 'Question' } }
    }
    md.use(calloutPlugin, opts)
    const html = render(md, '> [!question]\n> What is this?')
    expect(html).toContain('Question')
    expect(html).not.toContain('QUESTION')
  })

  it('inline title wins over configured title', () => {
    const opts: CalloutPluginOptions = {
      types: { question: { title: 'Question' } }
    }
    md.use(calloutPlugin, opts)
    const html = render(md, '> [!question] My Custom Title\n> Content')
    expect(html).toContain('My Custom Title')
    expect(html).not.toContain('Question')
  })

  it('falls back to type.toUpperCase when no config and no inline title', () => {
    md.use(calloutPlugin, {})
    const html = render(md, '> [!unknown]\n> Content')
    expect(html).toContain('UNKNOWN')
  })

  it('works without options (backward compatible)', () => {
    md.use(calloutPlugin)
    const html = render(md, '> [!custom]\n> Body')
    expect(html).toContain('CUSTOM')
    expect(html).toContain('custom-block custom-callout')
  })

  it('rejects type names >= 20 characters', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    md.use(calloutPlugin)
    const html = render(md, '> [!abcdefghijklmnopqrst]\n> Body')
    expect(html).not.toContain('custom-block')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('less than 20'))
    warn.mockRestore()
  })
})

describe('calloutPlugin — preset types', () => {
  let md: MarkdownIt

  beforeEach(() => {
    md = new MarkdownIt()
  })

  it('skips preset callouts by default', () => {
    md.use(calloutPlugin)
    const html = render(md, '> [!note]\n> A note')
    // VitePress would handle it; plugin leaves it as regular blockquote
    expect(html).not.toContain('custom-block')
  })

  it('processes preset callouts when overridePresets is true', () => {
    md.use(calloutPlugin, { overridePresets: true })
    const html = render(md, '> [!note]\n> A note')
    expect(html).toContain('custom-block custom-callout')
    expect(html).toContain('NOTE')
  })

  it('uses configured title for overridden preset', () => {
    const opts: CalloutPluginOptions = {
      overridePresets: true,
      types: { note: { title: 'My Note' } }
    }
    md.use(calloutPlugin, opts)
    const html = render(md, '> [!note]\n> A note')
    expect(html).toContain('My Note')
    expect(html).not.toContain('NOTE')
  })

  it('does not process presets when overridePresets is explicitly false', () => {
    md.use(calloutPlugin, { overridePresets: false })
    const html = render(md, '> [!tip]\n> A tip')
    expect(html).not.toContain('custom-block')
  })

  it('still processes custom types when overridePresets is false', () => {
    md.use(calloutPlugin, {
      overridePresets: false,
      types: { question: { title: 'Q' } }
    })
    const html = render(md, '> [!question]\n> What?')
    expect(html).toContain('custom-block')
    expect(html).toContain('Q')
  })
})

describe('calloutPlugin — title resolution priority', () => {
  let md: MarkdownIt

  beforeEach(() => {
    md = new MarkdownIt()
  })

  it('resolves: inline title > configured title > type.toUpperCase()', () => {
    md.use(calloutPlugin, {
      types: { test: { title: 'Configured' } }
    })

    // No inline title — uses configured
    const a = render(md, '> [!test]\n> a')
    expect(a).toContain('Configured')

    // Inline title wins
    const b = render(md, '> [!test] Override\n> b')
    expect(b).toContain('Override')
    expect(b).not.toContain('Configured')

    // No config, no inline — uppercase
    const c = render(md, '> [!foo]\n> c')
    expect(c).toContain('FOO')
  })
})
