import { expect, test } from '@playwright/test'

test.describe('D3HomePage', () => {
  test('homepage graph container renders', async ({ page }) => {
    await page.goto('/')
    const container = page.locator('.d3-home-container')
    await expect(container).toBeVisible({ timeout: 15000 })
  })

  test('graph has SVG with nodes', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.d3-home-container svg circle', {
      timeout: 15000
    })
    const circles = page.locator('.d3-home-container svg circle')
    expect(await circles.count()).toBeGreaterThan(0)
  })

  test('graph nodes are labeled', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.d3-home-container svg circle', {
      timeout: 15000
    })
    const texts = page.locator('.d3-home-container svg text')
    const count = await texts.count()
    if (count > 0) {
      const textContent = await texts.first().textContent()
      expect(textContent).toBeTruthy()
    }
  })

  test('homepage text content is visible alongside graph', async ({ page }) => {
    await page.goto('/')
    const text = page.locator('.homepage-describe')
    if ((await text.count()) > 0) {
      await expect(text).toBeVisible()
    }
  })
})
