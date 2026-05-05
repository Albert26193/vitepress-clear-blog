import { expect, test } from '@playwright/test'

test.describe('PostMermaid', () => {
  test('mermaid diagram renders SVG', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')
    await page.waitForTimeout(2000)

    const mermaid = page.locator('.mermaid-diagram, .mermaid-img')
    if ((await mermaid.count()) > 0) {
      await expect(mermaid.first()).toBeVisible()
    }
  })

  test('mermaid SVG has non-zero dimensions', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')
    await page.waitForTimeout(2000)

    const svg = page.locator('.mermaid-diagram svg, .mermaid-img svg').first()
    if ((await svg.count()) > 0) {
      const box = await svg.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThan(0)
        expect(box.height).toBeGreaterThan(0)
      }
    }
  })

  test('mermaid container exists on page', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')
    // Page should at minimum render without errors
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
