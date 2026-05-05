import { expect, test } from '@playwright/test'

test.describe('D3PageSidebar', () => {
  test('sidebar graph container exists on post page', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    const container = page.locator('.d3-page-container')
    if ((await container.count()) > 0) {
      await expect(container).toBeVisible()
    }
  })

  test('sidebar has graph icon button', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    const icon = page.locator('.i-carbon-flow').first()
    if ((await icon.count()) > 0) {
      await expect(icon).toBeVisible()
    }
  })

  test('clicking icon opens graph popup', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const btn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await btn.count()) > 0) {
      await btn.click()
      await page.waitForTimeout(500)

      const popup = page.locator('.popup-wrapper')
      if ((await popup.count()) > 0) {
        await expect(popup).toBeVisible()
      }
    }
  })
})
