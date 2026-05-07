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
    await expect(existing).not.toHaveClass(/clear-wikilink--broken/)
    await expect(missing).toBeVisible()
    await expect(missing).toHaveClass(/clear-wikilink--broken/)

    const textDecorationStyle = await missing.evaluate(
      (element) => getComputedStyle(element).textDecorationStyle
    )
    expect(textDecorationStyle).toBe('dashed')
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
