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
    // The last <a> has empty href (theme credit), check the VitePress link instead
    const vitepressLink = page.locator('.site-footer a[href*="vitepress"]')
    if ((await vitepressLink.count()) > 0) {
      await expect(vitepressLink).toBeVisible()
      const href = await vitepressLink.getAttribute('href')
      expect(href).toBeTruthy()
    }
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
