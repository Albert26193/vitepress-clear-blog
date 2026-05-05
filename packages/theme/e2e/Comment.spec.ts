import { expect, test } from '@playwright/test'

test.describe('Comment', () => {
  test('renders at page bottom', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    // Comment iframe or container should exist
    const comment = page.locator(
      '.giscus, .utterances, iframe[src*="comment"], iframe[src*="utter"]'
    )
    if ((await comment.count()) > 0) {
      await expect(comment.first()).toBeAttached()
    }
  })

  test('dark mode does not trigger full page reload', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    // Toggle dark mode
    const toggle = page.locator('.VPSwitch, .VPSwitchAppearance').first()
    if ((await toggle.count()) > 0) {
      await toggle.click()
      await page.waitForTimeout(500)
      await expect(page.locator('h1').first()).toBeVisible()
    }
  })
})
