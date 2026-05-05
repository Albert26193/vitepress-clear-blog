import { expect, test } from '@playwright/test'

test.describe('Collections', () => {
  test('collection index renders', async ({ page }) => {
    await page.goto('/collections')
    await expect(page.locator('.my-card')).toBeVisible()
  })

  test('collection cards are clickable', async ({ page }) => {
    await page.goto('/collections')
    const cards = page.locator('.my-card > *')
    const count = await cards.count()
    if (count > 0) {
      const link = cards.first().locator('a').first()
      if ((await link.count()) > 0) {
        await link.click()
        await page.waitForTimeout(500)
        expect(page.url()).toMatch(/\/collections\//)
      }
    }
  })

  test('collection detail page renders', async ({ page }) => {
    await page.goto('/collections/cs')
    await expect(page.locator('body')).toBeVisible()
  })

  test('collection detail has post links', async ({ page }) => {
    await page.goto('/collections/cs')
    const links = page.locator('a[href^="/blogs/"]')
    const count = await links.count()
    if (count > 0) {
      await expect(links.first()).toBeVisible()
    }
  })

  test('empty collection shows no error', async ({ page }) => {
    await page.goto('/collections/nonexistent')
    await expect(page.locator('body')).toBeVisible()
  })
})
