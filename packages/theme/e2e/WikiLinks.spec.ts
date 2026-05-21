import { expect, test } from '@playwright/test'

const missingWikiLinkText =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

test.describe('WikiLinks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForLoadState('networkidle')
  })

  test('marks unresolved inline wiki links', async ({ page }) => {
    const existing = page
      .locator('a.clear-wikilink', { hasText: '111' })
      .first()
    const missing = page
      .locator('a.clear-wikilink', { hasText: missingWikiLinkText })
      .first()

    await expect(existing).toBeVisible()
    await expect(existing).not.toHaveClass(/broken-link/)
    await expect(existing).toHaveAttribute('data-link-internal', '')
    await expect(existing).not.toHaveAttribute('data-link-broken', '')
    await expect(missing).toBeVisible()
    await expect(missing).toHaveClass(/broken-link/)
    await expect(missing).toHaveAttribute('data-link-broken', '')

    const textDecorationStyle = await missing.evaluate(
      (element) => getComputedStyle(element).textDecorationStyle
    )
    expect(textDecorationStyle).toBe('dashed')
  })

  test('applies wiki link style only to markdown content links', async ({
    page
  }) => {
    await expect(page.locator('html')).toHaveAttribute(
      'data-link-style',
      'wiki'
    )

    const wikiLink = page
      .locator('a.clear-wikilink', { hasText: '111' })
      .first()
    const markdownInternalLink = page
      .locator('.vp-doc a[href$="111.html"][data-link-style-target]')
      .filter({ hasNot: page.locator('.clear-wikilink') })
      .first()
    const externalImageLink = page
      .locator('.vp-doc a[href^="https://"]')
      .first()

    await expect(wikiLink).toHaveAttribute('data-link-internal', '')
    await expect(wikiLink).toHaveAttribute('data-link-style-target', '')
    await expect(markdownInternalLink).toHaveAttribute('data-link-internal', '')
    await expect(markdownInternalLink).toHaveAttribute(
      'data-link-style-target',
      ''
    )
    await expect(externalImageLink).not.toHaveAttribute(
      'data-link-internal',
      ''
    )

    const wikiBefore = await wikiLink.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )
    const markdownBefore = await markdownInternalLink.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )
    const externalBefore = await externalImageLink.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )

    expect(wikiBefore).toContain('[[')
    expect(markdownBefore).toContain('[[')
    expect(externalBefore).not.toContain('[[')
  })

  test('renders inline wiki and markdown links with matching page hrefs', async ({
    page
  }) => {
    const wikiLink = page
      .locator('a.clear-wikilink', { hasText: '111' })
      .first()
    const markdownInternalLink = page
      .locator('.vp-doc a[href="/blogs/111.html"][data-link-style-target]')
      .filter({ hasNot: page.locator('.clear-wikilink') })
      .first()

    await expect(wikiLink).toHaveAttribute('href', '/blogs/111.html')
    await expect(markdownInternalLink).toBeVisible()
    await expect(markdownInternalLink).toHaveAttribute(
      'href',
      '/blogs/111.html'
    )
  })

  test('does not apply wiki decoration to timeline post links', async ({
    page
  }) => {
    await page.goto('/timeline')
    await page.waitForLoadState('networkidle')

    const timelinePostLink = page
      .locator('.timeline-page .post-item', { hasText: 'Test title' })
      .first()

    await expect(timelinePostLink).toBeVisible()
    await expect(timelinePostLink).not.toHaveAttribute(
      'data-link-style-target',
      ''
    )

    const before = await timelinePostLink.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )
    expect(before).not.toContain('[[')
  })

  test('renders hashtag tags without anchor wiki decoration', async ({
    page
  }) => {
    await page.goto('/blogs/some-doc')
    await page.waitForLoadState('networkidle')

    const hashtagTag = page
      .locator('.vp-doc .blog-tag', { hasText: '#aaa' })
      .first()

    await expect(hashtagTag).toBeVisible()
    await expect(hashtagTag).not.toHaveJSProperty('tagName', 'A')
    await expect(hashtagTag).not.toHaveAttribute('data-link-style-target', '')

    const before = await hashtagTag.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )
    expect(before).not.toContain('[[')
  })

  test('does not render wiki decoration for broken links', async ({ page }) => {
    const missing = page
      .locator('a.clear-wikilink', { hasText: missingWikiLinkText })
      .first()

    await expect(missing).toHaveClass(/broken-link/)

    const before = await missing.evaluate(
      (element) => getComputedStyle(element, '::before').content
    )
    expect(before).not.toContain('[[')
  })

  test('does not render unresolved wiki links in the sidebar graph', async ({
    page
  }) => {
    await page.waitForSelector('.d3-page-container svg')

    const missingGraphNode = page.locator('.d3-page-container text', {
      hasText: missingWikiLinkText
    })

    await expect(missingGraphNode).toHaveCount(0)
  })
})
