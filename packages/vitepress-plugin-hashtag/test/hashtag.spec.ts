import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'

import { hashtagPlugin } from '../src/node/hashtag'

describe('hashtagPlugin', () => {
  it('renders hashtag_open with lowercase tag name', () => {
    const md = new MarkdownIt()
    hashtagPlugin(md)

    const openRule = md.renderer.rules.hashtag_open
    expect(openRule).toBeDefined()

    const result = openRule!(
      [{ content: 'VueJS', type: 'hashtag_open' } as any],
      0,
      {},
      {},
      {} as any
    )
    expect(result).toContain('vuejs')
    expect(result).toContain('<HashtagTag')
    expect(result).toContain('tag="vuejs"')
  })

  it('renders hashtag_text with # prefix', () => {
    const md = new MarkdownIt()
    hashtagPlugin(md)

    const textRule = md.renderer.rules.hashtag_text
    expect(textRule).toBeDefined()

    const result = textRule!(
      [{ content: 'MyTag', type: 'hashtag_text' } as any],
      0,
      {},
      {},
      {} as any
    )
    expect(result).toBe('#MyTag')
  })

  it('renders hashtag_close as closing component tag', () => {
    const md = new MarkdownIt()
    hashtagPlugin(md)

    const closeRule = md.renderer.rules.hashtag_close
    expect(closeRule).toBeDefined()

    const result = closeRule!([], 0, {}, {}, {} as any)
    expect(result).toBe('</HashtagTag>')
  })

  it('handles tags with special characters', () => {
    const md = new MarkdownIt()
    hashtagPlugin(md)

    const openRule = md.renderer.rules.hashtag_open
    const result = openRule!(
      [{ content: 'C++', type: 'hashtag_open' } as any],
      0,
      {},
      {},
      {} as any
    )
    expect(result).toContain('c++')
  })

  it('can be applied to a markdown-it instance multiple times without error', () => {
    const md = new MarkdownIt()
    hashtagPlugin(md)
    expect(() => hashtagPlugin(md)).not.toThrow()
  })
})
