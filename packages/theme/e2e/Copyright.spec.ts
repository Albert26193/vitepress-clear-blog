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
    await page.waitForSelector('.site-footer')
    const poweredByLink = page.locator(
      '.site-footer a[href*="vitepress.vuejs"]'
    )
    await expect(poweredByLink).toBeVisible()
    expect(await poweredByLink.getAttribute('href')).toBeTruthy()

    const themeLink = page.locator('.site-footer a[target="_blank"]').last()
    await expect(themeLink).toBeVisible()
    expect(await themeLink.getAttribute('href')).toBeTruthy()
  })

  test('footer visible on all route types', async ({ page }) => {
    for (const route of [
      '/',
      '/pages',
      '/blogs/vitepress-first',
      '/timeline',
      '/tags'
    ]) {
      await page.goto(route)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect(page.locator('.site-footer')).toBeVisible()
    }
  })
})
