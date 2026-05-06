import { expect, test } from '@playwright/test'

test.describe('BlogCardItem', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages')
    await expect(page.locator('.blog-card').first()).toBeVisible()
  })

  test('card has title', async ({ page }) => {
    const title = page.locator('.blog-card .card-title').first()
    await expect(title).toBeVisible()
    const text = await title.textContent()
    expect(text).toBeTruthy()
  })

  test('card has date', async ({ page }) => {
    const time = page.locator('.blog-card .card-time').first()
    await expect(time).toBeVisible()
  })

  test('card has tags', async ({ page }) => {
    const card = page.locator('.blog-card').first()
    const tags = card.locator('.tag')
    const count = await tags.count()
    if (count > 0) {
      await expect(tags.first()).toBeVisible()
    }
  })

  test('card has description', async ({ page }) => {
    const desc = page.locator('.blog-card .describe').first()
    if ((await desc.count()) > 0) {
      await expect(desc).toBeVisible()
    }
  })

  test('clicking card navigates to post', async ({ page }) => {
    const card = page.locator('.blog-card').first()
    await card.click()
    await page.waitForTimeout(500)
    expect(page.url()).toMatch(/\/blogs\//)
    const h1 = await page.locator('h1').first().textContent()
    expect(h1).toBeTruthy()
  })

  test('all cards have consistent structure', async ({ page }) => {
    const cards = page.locator('.blog-card')
    const count = await cards.count()
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = cards.nth(i)
      await expect(
        card.locator(':scope > .card-header .card-title')
      ).toBeVisible()
      await expect(
        card.locator(':scope > .card-banner .card-time')
      ).toBeVisible()
    }
  })
})
