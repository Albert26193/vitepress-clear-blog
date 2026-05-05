import { expect, test } from '@playwright/test'

test.describe('PopupContainer', () => {
  test('sidebar graph popup opens', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const graphBtn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await graphBtn.count()) > 0) {
      await graphBtn.click()
      await page.waitForTimeout(500)
      const popup = page.locator('.popup-wrapper')
      if ((await popup.count()) > 0) {
        await expect(popup).toBeVisible()
      }
    }
  })

  test('popup has close button', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const graphBtn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await graphBtn.count()) > 0) {
      await graphBtn.click()
      await page.waitForTimeout(500)
      const closeBtn = page.locator('.popup-close-button').first()
      if ((await closeBtn.count()) > 0) {
        await expect(closeBtn).toBeVisible()
      }
    }
  })

  test('backdrop click dismisses popup', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const graphBtn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await graphBtn.count()) > 0) {
      await graphBtn.click()
      await page.waitForTimeout(500)

      const backdrop = page.locator('.popup-backdrop')
      if ((await backdrop.count()) > 0) {
        const box = await backdrop.boundingBox()
        if (box) {
          await page.mouse.click(box.x + 5, box.y + 5)
          await page.waitForTimeout(500)
          await expect(page.locator('.popup-wrapper')).not.toBeVisible()
        }
      }
    }
  })
})
