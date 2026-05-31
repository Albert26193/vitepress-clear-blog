import { expect, test } from '@playwright/test'

/**
 * Boundary verification for issue #434.
 *
 * Drives the demo's deep-path boundary page and asserts, case by case, that
 * inline wikilinks resolve consistently across the 8 syntax variants named in
 * the issue: valid, invalid (vault-absolute), broken, relative, nested,
 * anchor, alias, and extension/asset. Build-time resolution (analyzer +
 * markdown-it wikilink plugin) bakes the final href/class/broken state into the
 * static HTML, so these assertions exercise the same surface a reader sees.
 */
const BOUNDARY_PATH =
  '/blogs/wikilinks/edge-cases/very/deep/nested/path/wikilinks-boundary-test.html'

/** Resolve a wikilink anchor by its exact visible label. */
const wikiLink = (page: import('@playwright/test').Page, label: string) =>
  page.locator('.vp-doc a.clear-wikilink', { hasText: label }).first()

test.describe('WikiLinks boundary (#434)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BOUNDARY_PATH)
    await page.waitForLoadState('networkidle')
  })

  test('valid: nested and obsidian-shortest targets resolve to real pages', async ({
    page
  }) => {
    // C.1 unique english basename — match on the (unique) resolved href rather
    // than the visible label, which heti rewrites at CJK/Latin boundaries.
    const advanced = page
      .locator(
        '.vp-doc a.clear-wikilink[href="/blogs/wikilinks/wikilinks-advanced-techniques.html"]'
      )
      .first()
    await expect(advanced).toBeVisible()
    await expect(advanced).not.toHaveClass(/broken-link/)
    await expect(advanced).toHaveAttribute('data-link-style-target', '')

    // C.3 dir/basename disambiguation (nested target)
    const dbDoc = page
      .locator(
        '.vp-doc a.clear-wikilink[href="/blogs/DB/数据库-BufferPool的原理.html"]'
      )
      .first()
    await expect(dbDoc).toBeVisible()
    await expect(dbDoc).not.toHaveClass(/broken-link/)
  })

  test('invalid: vault-absolute [[/path]] is consistently broken', async ({
    page
  }) => {
    for (const label of ['/about', '/collections/operations/部署与运维实践']) {
      const link = wikiLink(page, label)
      await expect(link).toHaveClass(/broken-link/)
      await expect(link).toHaveAttribute('data-link-broken', '')
    }
  })

  test('broken: links keep an in-site href and the broken visual style', async ({
    page
  }) => {
    const missing = wikiLink(page, '../../../../../this-truly-missing')
    await expect(missing).toHaveAttribute(
      'href',
      '/blogs/wikilinks/this-truly-missing.html'
    )
    await expect(missing).toHaveClass(/broken-link/)
    await expect(missing).toHaveAttribute('data-link-broken', '')

    // broken links use a dashed underline and must NOT get the [[ ]] decoration
    const decoration = await missing.evaluate(
      (el) => getComputedStyle(el).textDecorationStyle
    )
    expect(decoration).toBe('dashed')
    const before = await missing.evaluate(
      (el) => getComputedStyle(el, '::before').content
    )
    expect(before).not.toContain('[[')
  })

  test('relative: excess ../ falls back to a unique basename', async ({
    page
  }) => {
    // B.3 excess ../ across groups still resolves via unique basename
    const getting = wikiLink(page, 'Getting Started with VitePress Theme Link')
    await expect(getting).toHaveAttribute('href', '/blogs/getting-started.html')
    await expect(getting).not.toHaveClass(/broken-link/)
  })

  test('anchor: hash is preserved and pure-hash stays a same-page link', async ({
    page
  }) => {
    // D.2 basename + #anchor keeps the anchor on the resolved href
    const withAnchor = page
      .locator('.vp-doc a.clear-wikilink[href$="#基础语法"]')
      .first()
    await expect(withAnchor).toHaveAttribute(
      'href',
      '/blogs/wikilinks/wikilinks-basic-guide.html#基础语法'
    )
    await expect(withAnchor).not.toHaveClass(/broken-link/)

    // D.4 pure #anchor stays an in-page hash link, never broken
    const pureHash = wikiLink(page, '#结论')
    await expect(pureHash).toHaveAttribute('href', '#结论')
    await expect(pureHash).not.toHaveClass(/broken-link/)
  })

  test('alias: explicit [[target|alias]] renders the alias label', async ({
    page
  }) => {
    // D.1 alias only — pure-CJK substring avoids the heti CJK/Latin rewrite.
    const aliased = wikiLink(page, '基础入门指南')
    await expect(aliased).toHaveAttribute(
      'href',
      '/blogs/wikilinks/wikilinks-basic-guide.html'
    )
    await expect(aliased).not.toHaveClass(/broken-link/)

    // D.3 anchor + alias together: alias label wins and the anchor is kept
    const aliasedAnchor = wikiLink(page, '查看「基础语法」章节')
    await expect(aliasedAnchor).toHaveAttribute(
      'href',
      '/blogs/wikilinks/wikilinks-basic-guide.html#基础语法'
    )
  })

  test('extension/asset: .md and .html resolve, real assets stay raw', async ({
    page
  }) => {
    // E.1/E.2 explicit .md and .html both map to the same page. The same href
    // is also produced by the (intentionally broken) vault-absolute A.1 case,
    // so scope to the non-broken variants to assert the valid resolution.
    const pages = page.locator(
      '.vp-doc a.clear-wikilink[href="/blogs/wikilinks/wikilinks-basic-guide.html"]:not(.broken-link)'
    )
    await expect(pages.first()).toBeVisible()
    await expect(await pages.count()).toBeGreaterThanOrEqual(2)

    // E.3 real asset keeps its raw href and is not flagged broken
    const asset = wikiLink(page, 'boundary-asset.svg')
    await expect(asset).toHaveAttribute('href', 'boundary-asset.svg')
    await expect(asset).not.toHaveClass(/broken-link/)
  })

  test('nested: directory wikilink resolves to that directory index', async ({
    page
  }) => {
    // F.1/F.2 implicit dir and explicit index both land on blogs/DB/index.html
    const dirLinks = page.locator(
      '.vp-doc a.clear-wikilink[href="/blogs/DB/index.html"]'
    )
    await expect(dirLinks.first()).toBeVisible()
    await expect(dirLinks.first()).not.toHaveClass(/broken-link/)
    await expect(await dirLinks.count()).toBeGreaterThanOrEqual(2)
  })

  test('defensive: whitespace/garbage targets are broken, empty stays literal', async ({
    page
  }) => {
    // G.3 whitespace-only target falls back to href="#"
    const blank = page
      .locator('.vp-doc a.clear-wikilink.broken-link[href="#"]')
      .first()
    await expect(blank).toHaveAttribute('data-link-broken', '')

    // G.5 emoji target is broken
    const emoji = wikiLink(page, '这个不存在🚀')
    await expect(emoji).toHaveClass(/broken-link/)

    // G.2 empty [[]] is never turned into an anchor
    await expect(page.locator('.vp-doc a', { hasText: '[[]]' })).toHaveCount(0)
  })

  test('navigation: a broken link routes to 404, not the homepage', async ({
    page
  }) => {
    const missing = wikiLink(page, '../../../../../this-truly-missing')
    await missing.click()
    await page.waitForLoadState('networkidle')
    // VitePress renders its NotFound layout; the URL must not collapse to "/"
    await expect(page).not.toHaveURL(/\/$/)
    await expect(
      page.locator('text=/404|PAGE NOT FOUND/i').first()
    ).toBeVisible()
  })
})
