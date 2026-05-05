import { expect, test } from '@playwright/test'

test.describe('DocBanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
  })

  test('banner renders with meta description area', async ({ page }) => {
    const banner = page.locator('#hack-article-des')
    await expect(banner).toBeVisible({ timeout: 10000 })
  })

  test('tags are displayed as clickable badges', async ({ page }) => {
    const tags = page.locator('.tags-container .tag')
    const count = await tags.count()
    if (count > 0) {
      await expect(tags.first()).toBeVisible()
      const tagText = await tags.first().textContent()
      expect(tagText).toBeTruthy()
    }
  })

  test('clicking a tag navigates to filtered tags page', async ({ page }) => {
    const tag = page.locator('.tag-wrapper .tag').first()
    if ((await tag.count()) === 0) return

    await tag.click()
    await page.waitForTimeout(500)
    expect(page.url()).toMatch(/\/tags/)
  })

  test('word count is displayed', async ({ page }) => {
    const wordCount = page.locator('text=/\\d+ words/')
    await expect(wordCount).toBeVisible()
  })

  test('date is displayed', async ({ page }) => {
    const dateEl = page.locator('#hack-article-des .flex.items-center')
    await expect(dateEl).toBeVisible()
  })

  test('mobile viewport does not break tag layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    const banner = page.locator('#hack-article-des')
    await expect(banner).toBeVisible()
    // Tags should either scroll or wrap, not overflow viewport
    const box = await banner.boundingBox()
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(380)
    }
  })
})
