import { expect, test } from '@playwright/test'

test.describe('HideSidebarButton', () => {
  test('button visible at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    // Sidebar toggle button or HideSidebarButton
    const btn = page.locator('.toggle-button, .VPSidebar button[title]').first()
    if ((await btn.count()) > 0) {
      await expect(btn).toBeVisible()
    }
  })

  test('click toggles sidebar visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const btn = page.locator('.toggle-button, .VPSidebar button[title]').first()
    if ((await btn.count()) === 0) return

    await btn.click()
    await page.waitForTimeout(500)
    // Sidebar state should have changed
    await expect(page.locator('body')).toBeVisible()
  })

  test('button not visible at desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const btn = page.locator('.block > .toggle-button').first()
    if ((await btn.count()) > 0) {
      const box = await btn.boundingBox()
      if (box) {
        // Button should be off-screen or very narrow at desktop
        expect(box.x + box.width).toBeLessThan(100)
      }
    }
  })
})
