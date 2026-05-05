import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('homepage container renders', async ({ page }) => {
    const container = page.locator('.homepage-container')
    await expect(container).toBeVisible({ timeout: 10000 })
  })

  test('site title is displayed', async ({ page }) => {
    const title = page.locator('.homepage-container h1')
    await expect(title.first()).toBeVisible()
    const text = await title.first().textContent()
    expect(text).toBeTruthy()
  })

  test('homepage description text is visible', async ({ page }) => {
    const desc = page.locator('.homepage-describe')
    if ((await desc.count()) > 0) {
      await expect(desc).toBeVisible()
    }
  })

  test('footer is visible at bottom', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('.site-footer')).toBeVisible()
  })

  test('page has proper title tag', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/)
  })
})
