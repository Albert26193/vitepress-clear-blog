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
    await writeFile(
      resolve(docsDir, 'src/utils/node/target-page.md'),
      '# Target'
    )
    await writeFile(
      resolve(docsDir, 'test/utils/node/source-page.md'),
      '# Source'
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
      { base: '/vitepress-clear-blog/testbed/' }
    )

    expect(html).toContain(
      'href="/vitepress-clear-blog/testbed/src/utils/node/target-page.html"'
    )
    expect(html).toContain('href="/src/utils/node/target-page.html"')
    expect(html).not.toContain(
      '/vitepress-clear-blog/testbed/vitepress-clear-blog/testbed/'
    )
  })

  it('omits html suffix when cleanUrls is enabled', async () => {
    const html = await render(
      '[[target-page|Target page]] [Target](target-page)',
      { relativePath: 'test/utils/node/source-page.md' },
      { base: '/vitepress-clear-blog/testbed/', cleanUrls: true }
    )

    expect(html).toContain(
      'href="/vitepress-clear-blog/testbed/src/utils/node/target-page"'
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
    const html = await render('[Missing](../missing/target-page)', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="../missing/target-page"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
  })

  it('marks unresolved wikilinks as broken', async () => {
    const html = await render('[[../missing/target-page|Broken]]', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/../missing/target-page"')
    expect(html).toContain('broken-link')
    expect(html).toContain('data-link-broken')
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

    expect(html).toContain('href="/target-page"')
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
