import MarkdownIt from 'markdown-it'
import { beforeEach, describe, expect, it } from 'vitest'

import { imageDimensionPlugin } from '../src/node/image-dimension'
import type { ImageDimensionPluginOptions } from '../src/node/image-dimension'

const render = (md: MarkdownIt, src: string) =>
  md.render(src).replace(/\n$/, '')

const createMarkdown = (options?: ImageDimensionPluginOptions) => {
  const md = new MarkdownIt()
  md.use(imageDimensionPlugin, options)
  return md
}

describe('imageDimensionPlugin — conventions', () => {
  let md: MarkdownIt

  beforeEach(() => {
    md = createMarkdown()
  })

  it('normalizes legacy alt presets and cleans alt text', () => {
    const html = render(md, '![Photo |m](img.png)')
    expect(html).toContain('src="img.png"')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('width="500"')
  })

  it('supports empty-alt Obsidian bare width', () => {
    const html = render(md, '![|500](img.png)')
    expect(html).toContain('alt=""')
    expect(html).toContain('width="500"')
  })

  it('supports alt Obsidian bare width', () => {
    const html = render(md, '![Photo|500](img.png)')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('width="500"')
  })

  it('supports Obsidian pixel dimensions', () => {
    const html = render(md, '![Photo|300x200](img.png)')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('width="300"')
    expect(html).toContain('height="200"')
  })

  it('supports GitHub title suffix dimensions', () => {
    const html = render(md, '![Photo](img.png =300x200)')
    expect(html).toContain('src="img.png"')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('width="300"')
    expect(html).toContain('height="200"')
  })

  it('supports Pandoc attribute list dimensions', () => {
    const html = render(md, '![Photo](img.png){width=300 height=200}')
    expect(html).toContain('width="300"')
    expect(html).toContain('height="200"')
    expect(html).not.toContain('{width=300 height=200}')
  })

  it('supports URL query parameter dimensions and keeps query by default', () => {
    const html = render(md, '![Photo](img.png?width=300&height=200)')
    expect(html).toContain('src="img.png?width=300&amp;height=200"')
    expect(html).toContain('width="300"')
    expect(html).toContain('height="200"')
  })

  it('supports HTML-style title dimensions and removes the title marker', () => {
    const html = render(md, '![Photo](img.png "=300x")')
    expect(html).toContain('width="300"')
    expect(html).not.toContain('title="=300x"')
  })
})

describe('imageDimensionPlugin — options', () => {
  it('supports custom presets and height-only preset objects', () => {
    const md = createMarkdown({ presets: { hero: { height: 240 } } })
    const html = render(md, '![Photo|hero](img.png)')
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('height="240"')
    expect(html).not.toContain('width=')
  })

  it('ignores invalid custom presets', () => {
    const md = createMarkdown({ presets: { bad: 0 } })
    const html = render(md, '![Photo|bad](img.png)')
    expect(html).toContain('alt="Photo|bad"')
    expect(html).not.toContain('width=')
  })

  it('can strip dimension query params without remaining query or hash', () => {
    const md = createMarkdown({ stripDimensionQuery: true })
    const html = render(md, '![Photo](img.png?width=300)')
    expect(html).toContain('src="img.png"')
    expect(html).toContain('width="300"')
  })

  it('can disable Obsidian bare size', () => {
    const md = createMarkdown({ conventions: { obsidianBareSize: false } })
    const html = render(md, '![Photo|500](img.png)')
    expect(html).toContain('alt="Photo|500"')
    expect(html).not.toContain('width="500"')
  })

  it('can disable Obsidian pixel size', () => {
    const md = createMarkdown({ conventions: { obsidianPixelSize: false } })
    const html = render(md, '![Photo|300x200](img.png)')
    expect(html).toContain('alt="Photo|300x200"')
    expect(html).not.toContain('width="300"')
    expect(html).not.toContain('height="200"')
  })

  it('can disable legacy alt presets', () => {
    const md = createMarkdown({ conventions: { altPreset: false } })
    const html = render(md, '![Photo |m](img.png)')
    expect(html).toContain('alt="Photo |m"')
    expect(html).not.toContain('width="500"')
  })

  it('can disable GitHub title suffix', () => {
    const md = createMarkdown({ conventions: { githubTitleSuffix: false } })
    const html = render(md, '![Photo](img.png =300x200)')
    expect(html).toContain('![Photo]')
    expect(html).not.toContain('<img')
  })

  it('can disable Pandoc attribute lists', () => {
    const md = createMarkdown({ conventions: { pandocAttrList: false } })
    const html = render(md, '![Photo](img.png){width=300}')
    expect(html).toContain('{width=300}')
    expect(html).not.toContain('width="300"')
  })

  it('can disable URL query params', () => {
    const md = createMarkdown({ conventions: { urlQueryParams: false } })
    const html = render(md, '![Photo](img.png?width=300)')
    expect(html).not.toContain('width="300"')
  })

  it('can disable HTML-style titles', () => {
    const md = createMarkdown({ conventions: { htmlTitleSize: false } })
    const html = render(md, '![Photo](img.png "=300x")')
    expect(html).toContain('title="=300x"')
    expect(html).not.toContain('width="300"')
  })

  it('can strip dimension query params when requested', () => {
    const md = createMarkdown({ stripDimensionQuery: true })
    const html = render(
      md,
      '![Photo](img.png?width=300&height=200&fit=cover#hero)'
    )
    expect(html).toContain('src="img.png?fit=cover#hero"')
    expect(html).toContain('width="300"')
    expect(html).toContain('height="200"')
  })
})

describe('imageDimensionPlugin — edge cases', () => {
  let md: MarkdownIt

  beforeEach(() => {
    md = createMarkdown()
  })

  it('leaves invalid alt suffixes unchanged', () => {
    const html = render(md, '![Photo|abc](img.png)')
    expect(html).toContain('alt="Photo|abc"')
    expect(html).not.toContain('width=')
  })

  it('leaves invalid title dimensions unchanged', () => {
    const html = render(md, '![Photo](img.png "=x")')
    expect(html).toContain('title="=x"')
    expect(html).not.toContain('width=')
    expect(html).not.toContain('height=')
  })

  it('rejects zero, negative, float, percent, and auto values', () => {
    const html = render(
      md,
      '![A](a.png){width=0} ![B](b.png){width=-1} ![C](c.png){width=1.5} ![D](d.png){width=50%} ![E](e.png){width=auto}'
    )
    expect(html).toContain('{width=0}')
    expect(html).toContain('{width=-1}')
    expect(html).toContain('{width=1.5}')
    expect(html).toContain('{width=50%}')
    expect(html).toContain('{width=auto}')
  })

  it('supports partial dimensions', () => {
    const widthOnly = render(md, '![Photo](img.png =300x)')
    expect(widthOnly).toContain('width="300"')
    expect(widthOnly).not.toContain('height=')

    const heightOnly = render(md, '![Photo](img.png =x200)')
    expect(heightOnly).toContain('height="200"')
    expect(heightOnly).not.toContain('width=')

    const pandocWidth = render(md, '![Photo](img.png){width=300}')
    expect(pandocWidth).toContain('width="300"')
    expect(pandocWidth).not.toContain('height=')
  })

  it('merges dimensions by priority per dimension', () => {
    const html = render(
      md,
      '![Photo|m](img.png?width=300&height=200){width=400}'
    )
    expect(html).toContain('alt="Photo"')
    expect(html).toContain('width="400"')
    expect(html).toContain('height="200"')
  })

  it('preserves text after a consumed Pandoc attribute list', () => {
    const html = render(md, '![Photo](img.png){width=300} text')
    expect(html).toContain('width="300"')
    expect(html).toContain(' text')
    expect(html).not.toContain('{width=300}')
  })

  it('leaves invalid GitHub suffix dimensions unchanged', () => {
    const html = render(md, '![Photo](img.png =x)')
    expect(html).toContain('![Photo]')
    expect(html).not.toContain('<img')
  })

  it('leaves plain links untouched', () => {
    const html = render(md, '[|500](img.png)')
    expect(html).toContain('<a href="img.png">|500</a>')
    expect(html).not.toContain('<img')
  })

  it('keeps width-only query dimensions', () => {
    const html = render(md, '![Photo](img.png?width=300)')
    expect(html).toContain('width="300"')
    expect(html).not.toContain('height=')
  })

  it('keeps height-only query dimensions', () => {
    const html = render(md, '![Photo](img.png?height=200)')
    expect(html).toContain('height="200"')
    expect(html).not.toContain('width=')
  })

  it('ignores query params without dimensions', () => {
    const html = render(md, '![Photo](img.png?fit=cover)')
    expect(html).not.toContain('width=')
    expect(html).not.toContain('height=')
  })

  it('preserves existing dimension attributes over parsed values', () => {
    const tokens = md.parseInline('![Photo|300](img.png)', {})[0].children
    if (!tokens) throw new Error('Expected inline children')
    tokens[0].attrSet('width', '640')
    const html = md.renderer.render(tokens, md.options, {})
    expect(html).toContain('width="640"')
  })
})
