import MarkdownIt from 'markdown-it'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createWikilinkPlugin } from '../../../src/utils/node/wikilinkPlugin'

const docsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/wikilinks'
)

const render = async (
  source: string,
  env: Record<string, unknown>,
  options: Parameters<typeof createWikilinkPlugin>[2] = {}
) => {
  const md = new MarkdownIt({ html: true })
  md.use(
    await createWikilinkPlugin(
      ['relativeToCurrentFile', 'obsidianShortest'],
      {
        docsDir
      },
      options
    )
  )
  return md.render(source, env)
}

describe('createWikilinkPlugin', () => {
  beforeAll(async () => {
    await mkdir(resolve(docsDir, 'src/utils/node'), { recursive: true })
    await mkdir(resolve(docsDir, 'test/utils/node'), { recursive: true })
    await mkdir(resolve(docsDir, 'assets'), { recursive: true })
    await mkdir(resolve(docsDir, 'guide'), { recursive: true })
    await writeFile(
      resolve(docsDir, 'src/utils/node/target-page.md'),
      '---\ntitle: Frontmatter Target\n---\n\n# Target Heading\n'
    )
    await writeFile(
      resolve(docsDir, 'test/utils/node/source-page.md'),
      '# Source'
    )
    await writeFile(resolve(docsDir, 'assets/diagram.svg'), '<svg></svg>')
    await writeFile(
      resolve(docsDir, 'guide/index.md'),
      '---\ntitle: Guide Home\n---\n\n# Guide Heading\n'
    )
  })

  afterAll(async () => {
    await rm(docsDir, { recursive: true, force: true })
  })

  it('renders resolved wikilinks with project hrefs', async () => {
    const html = await render('[[target-page|Target page]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/src/utils/node/target-page.html"')
    expect(html).toContain('class="clear-wikilink"')
    expect(html).toContain('Target page')
  })

  it('resolves regular markdown internal links with the same resolver', async () => {
    const html = await render('[Target](target-page)', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/src/utils/node/target-page.html"')
    expect(html).toContain('Target')
  })

  it('applies VitePress base only to custom wikilinks', async () => {
    const html = await render(
      '[[target-page|Target page]] [Target](target-page)',
      { relativePath: 'test/utils/node/source-page.md' },
      { base: '/vitepress-theme-link/testbed/' }
    )

    expect(html).toContain(
      'href="/vitepress-theme-link/testbed/src/utils/node/target-page.html"'
    )
    expect(html).toContain('href="/src/utils/node/target-page.html"')
    expect(html).not.toContain(
      '/vitepress-theme-link/testbed/vitepress-theme-link/testbed/'
    )
  })

  it('omits html suffix when cleanUrls is enabled', async () => {
    const html = await render(
      '[[target-page|Target page]] [Target](target-page)',
      { relativePath: 'test/utils/node/source-page.md' },
      { base: '/vitepress-theme-link/testbed/', cleanUrls: true }
    )

    expect(html).toContain(
      'href="/vitepress-theme-link/testbed/src/utils/node/target-page"'
    )
    expect(html).toContain('href="/src/utils/node/target-page"')
    expect(html).not.toContain('target-page.html')
  })

  it('preserves hash and query suffixes on resolved links', async () => {
    const html = await render(
      '[[target-page?from=wiki#part|Target page]] [Target](target-page?from=md#part)',
      { relativePath: 'test/utils/node/source-page.md' },
      { base: 'docs' }
    )

    expect(html).toContain(
      'href="/docs/src/utils/node/target-page.html?from=wiki#part"'
    )
    expect(html).toContain(
      'href="/src/utils/node/target-page.html?from=md#part"'
    )
  })

  it.each([
    ['alias', 'target-page'],
    ['file_name', 'target-page'],
    ['frontmatter_title', 'Frontmatter Target'],
    ['first_heading', 'Target Heading']
  ] as const)('renders labels in %s mode', async (renderTitle, expected) => {
    const html = await render(
      '[[target-page]]',
      { relativePath: 'test/utils/node/source-page.md' },
      { renderTitle }
    )

    expect(html).toContain(`>${expected}</a>`)
  })

  it('lets explicit aliases override renderTitle modes', async () => {
    const html = await render(
      '[[target-page|Explicit Alias]]',
      { relativePath: 'test/utils/node/source-page.md' },
      { renderTitle: 'frontmatter_title' }
    )

    expect(html).toContain('>Explicit Alias</a>')
    expect(html).not.toContain('Frontmatter Target')
  })

  it('forces leading-slash wikilinks to be broken', async () => {
    const html = await render('[[/src/utils/node/target-page]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/src/utils/node/target-page.html"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
  })

  it('preserves hash-only wikilinks as non-page links', async () => {
    const html = await render('[[#section]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="#section"')
    expect(html).toContain('>#section</a>')
    expect(html).not.toContain('broken-link')
    expect(html).not.toContain('data-link-broken')
  })

  it('preserves asset wikilinks as non-page links', async () => {
    const html = await render('[[../../assets/diagram.svg]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="../../assets/diagram.svg"')
    expect(html).not.toContain('broken-link')
    expect(html).not.toContain('data-link-broken')
  })

  it('marks blank wikilink targets as broken without resolving the docs root', async () => {
    const html = await render('[[   ]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="#"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
    expect(html).not.toContain('href="/index.html"')
  })

  it('resolves directory wikilinks to index pages', async () => {
    const html = await render('[[../../../guide]] [[../../../guide/index]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html.match(/href="\/guide\/index\.html"/g)).toHaveLength(2)
    expect(html).not.toContain('href="/guide.html"')
  })

  it('does not rewrite external or hash markdown links', async () => {
    const html = await render(
      '[External](https://example.com) [Hash](#section)',
      {
        relativePath: 'test/utils/node/source-page.md'
      }
    )

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('href="#section"')
    expect(html).not.toContain('broken-link')
  })

  it('does not rewrite or mark non-page markdown links as broken', async () => {
    const html = await render(
      '[PDF](./manual.pdf) [Image](../assets/diagram.png?raw#preview) [CDN](//cdn.example.com/lib.js)',
      {
        relativePath: 'test/utils/node/source-page.md'
      }
    )

    expect(html).toContain('href="./manual.pdf"')
    expect(html).toContain('href="../assets/diagram.png?raw#preview"')
    expect(html).toContain('href="//cdn.example.com/lib.js"')
    expect(html).not.toContain('broken-link')
    expect(html).not.toContain('data-link-broken')
  })

  it('marks broken regular markdown internal links', async () => {
    const html = await render('[Missing](../missing/no-such-page)', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/test/utils/missing/no-such-page.html"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
  })

  it('marks unresolved wikilinks as broken', async () => {
    const html = await render('[[../missing/no-such-page|Broken]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/test/utils/missing/no-such-page.html"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
  })

  it('formats broken markdown links and wikilinks consistently', async () => {
    const html = await render(
      '[[../missing/no-such-page|Broken Wiki]] [Broken Markdown](../missing/no-such-page)',
      { relativePath: 'test/utils/node/source-page.md' }
    )

    expect(
      html.match(/href="\/test\/utils\/missing\/no-such-page\.html"/g)
    ).toHaveLength(2)
    expect(html.match(/data-link-broken/g)).toHaveLength(2)
  })

  it('preserves clean URLs and suffixes on broken page candidates', async () => {
    const html = await render(
      '[[../missing/no-such-page?from=wiki#part|Broken Wiki]] [Broken Markdown](../missing/no-such-page?from=md#part)',
      { relativePath: 'test/utils/node/source-page.md' },
      { cleanUrls: true }
    )

    expect(html).toContain(
      'href="/test/utils/missing/no-such-page?from=wiki#part"'
    )
    expect(html).toContain(
      'href="/test/utils/missing/no-such-page?from=md#part"'
    )
    expect(html).not.toContain('no-such-page.html')
  })

  it('clamps overshooting broken page candidates to the vault root', async () => {
    const html = await render(
      '[[../../../../../../../../missing|Broken Wiki]] [Broken Markdown](../../../../../../../../missing)',
      { relativePath: 'test/utils/node/source-page.md' }
    )

    expect(html.match(/href="\/missing\.html"/g)).toHaveLength(2)
    expect(html.match(/data-link-broken/g)).toHaveLength(2)
  })

  it('leaves non-wikilink text unchanged', async () => {
    const html = await render('plain text', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('plain text')
    expect(html).not.toContain('clear-wikilink')
  })

  it('marks links as broken when current file is unavailable', async () => {
    const html = await render('[[target-page]]', {})

    expect(html).toContain('href="/target-page.html"')
    expect(html).toContain('broken-link')
  })

  it('supports default resolution modes and realPath env', async () => {
    const md = new MarkdownIt({ html: true })
    md.use(await createWikilinkPlugin(undefined, { docsDir }))

    const html = md.render('[[./source-page|Source]]', {
      realPath: resolve(docsDir, 'test/utils/node/source-page.md')
    })

    expect(html).toContain('href="/test/utils/node/source-page.html"')
    expect(html).toContain('Source')
  })
})
