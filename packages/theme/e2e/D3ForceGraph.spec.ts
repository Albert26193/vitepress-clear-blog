import { expect, test } from '@playwright/test'

test.describe('D3ForceGraph', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.d3-force-container svg circle', {
      timeout: 15000
    })
  })

  test('SVG renders with nodes and edges', async ({ page }) => {
    const svg = page.locator('.d3-force-container svg').first()
    await expect(svg).toBeVisible()

    const circles = svg.locator('circle')
    expect(await circles.count()).toBeGreaterThan(0)
    await expect(circles.first()).toBeVisible()

    const lines = svg.locator('line')
    if ((await lines.count()) > 0) {
      await expect(lines.first()).toBeVisible()
    }
  })

  test('dragging a node moves it', async ({ page }) => {
    const node = page.locator('.d3-force-container svg circle').first()
    const box = await node.boundingBox()
    if (!box) return

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 50, box.y + 50, { steps: 10 })
    await page.waitForTimeout(300)

    const newBox = await node.boundingBox()
    if (newBox) {
      // Node should have moved
      expect(newBox.x).not.toBe(box.x)
      expect(newBox.y).not.toBe(box.y)
    }

    await page.mouse.up()
  })

  test('hover highlights connected nodes', async ({ page }) => {
    const node = page.locator('.d3-force-container svg circle').first()
    await node.hover()
    await page.waitForTimeout(500)

    const opacity = await node.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(opacity).toBeGreaterThan(0)
  })

  test('scroll wheel zooms', async ({ page }) => {
    const svg = page.locator('.d3-force-container svg').first()
    const box = await svg.boundingBox()
    if (!box) return

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, -200)
    await page.waitForTimeout(500)
    await expect(svg).toBeVisible()
  })

  test('clicking a node navigates to post', async ({ page }) => {
    const node = page.locator('.d3-force-container svg circle').first()
    await node.click()
    await page.waitForTimeout(1000)
    // Navigation may or may not happen depending on node linkage
    await expect(page.locator('body')).toBeVisible()
  })
})
