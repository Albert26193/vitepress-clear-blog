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

const render = async (source: string, env: Record<string, unknown>) => {
  const md = new MarkdownIt({ html: true })
  md.use(
    await createWikilinkPlugin(['relativeToCurrentFile', 'obsidianShortest'], {
      docsDir
    })
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

    expect(html).toContain('href="/src/utils/node/target-page"')
    expect(html).toContain('class="clear-wikilink"')
    expect(html).toContain('Target page')
  })

  it('resolves regular markdown internal links with the same resolver', async () => {
    const html = await render('[Target](target-page)', {
      relativePath: 'test/utils/node/source-page.md'
    })

    expect(html).toContain('href="/src/utils/node/target-page"')
    expect(html).toContain('Target')
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

    expect(html).toContain('href="/test/utils/node/source-page"')
    expect(html).toContain('Source')
  })
})
