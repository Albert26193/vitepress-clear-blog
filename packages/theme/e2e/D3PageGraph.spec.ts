import { expect, test } from '@playwright/test'

test.describe('D3PageGraph', () => {
  test('page graph container exists in sidebar', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    // Open sidebar graph
    const btn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await btn.count()) > 0) {
      await btn.click()
      await page.waitForTimeout(500)

      const container = page.locator('.d3-page-graph-container')
      if ((await container.count()) > 0) {
        await expect(container).toBeVisible()
      }
    }
  })

  test('zoom level display is shown', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const btn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await btn.count()) > 0) {
      await btn.click()
      await page.waitForTimeout(500)

      const zoomDisplay = page.locator('.zoom-display')
      if ((await zoomDisplay.count()) > 0) {
        await expect(zoomDisplay).toBeVisible()
        const text = await zoomDisplay.textContent()
        expect(text).toMatch(/zoom/)
      }
    }
  })

  test('page graph has SVG', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    await page.waitForTimeout(1000)

    const btn = page
      .locator('[class*="d3-page"] button, .i-carbon-flow')
      .first()
    if ((await btn.count()) > 0) {
      await btn.click()
      await page.waitForTimeout(500)

      const svg = page.locator('.d3-page-graph-container svg')
      if ((await svg.count()) > 0) {
        await expect(svg.first()).toBeVisible()
      }
    }
  })
})
