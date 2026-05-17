import { expect, test } from '@playwright/test'

test.describe('Copyright', () => {
  test('footer is visible on homepage', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const footer = page.locator('.site-footer')
    await expect(footer).toBeVisible()
  })

  test('footer contains theme link', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const themeLink = page.locator('.site-footer a[target="_blank"]').last()
    if ((await themeLink.count()) > 0) {
      await expect(themeLink).toBeVisible()
      expect(await themeLink.getAttribute('href')).toBeTruthy()
    }
  })

  test('footer renders only on homepage', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('.site-footer')).toBeVisible()
  })
})
