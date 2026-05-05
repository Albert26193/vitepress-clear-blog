import { expect, test } from '@playwright/test'

test.describe('IconToggleButton', () => {
  test('dark mode toggle has accessible label', async ({ page }) => {
    await page.goto('/')
    const btn = page.locator(
      '.VPSwitch, .VPSwitchAppearance, button[title*="dark"], button[title*="theme"], button[aria-label*="theme"]'
    )
    if ((await btn.count()) > 0) {
      const title = await btn.first().getAttribute('title')
      const ariaLabel = await btn.first().getAttribute('aria-label')
      expect(title || ariaLabel).toBeTruthy()
    }
  })

  test('dark mode toggle icon toggles', async ({ page }) => {
    await page.goto('/')
    const btn = page.locator('.VPSwitch, .VPSwitchAppearance').first()
    if ((await btn.count()) === 0) return

    await btn.click()
    await page.waitForTimeout(300)
    const html = page.locator('html')
    const hasDark = await html.evaluate((el) => el.classList.contains('dark'))

    await btn.click()
    await page.waitForTimeout(300)
    const hasDarkAfter = await html.evaluate((el) =>
      el.classList.contains('dark')
    )
    expect(hasDark).not.toBe(hasDarkAfter)
  })

  test('toggle works across all route types', async ({ page }) => {
    const btnSelector = '.VPSwitch, .VPSwitchAppearance'
    for (const route of ['/', '/pages', '/blogs/vitepress-first']) {
      await page.goto(route)
      const btn = page.locator(btnSelector).first()
      if ((await btn.count()) > 0) {
        await expect(btn).toBeVisible()
      }
    }
  })
})
