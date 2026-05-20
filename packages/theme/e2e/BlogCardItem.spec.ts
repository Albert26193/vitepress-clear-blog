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

  test('card exposes link semantics for keyboard users', async ({ page }) => {
    const card = page.locator('.blog-card').first()
    await expect(card).toHaveAttribute('role', 'link')
    await expect(card).toHaveAttribute('tabindex', '0')
  })

  test('visible card chrome has consistent structure', async ({ page }) => {
    const cards = page
      .locator('.blog-card')
      .filter({ has: page.locator('.card-banner') })
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

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
