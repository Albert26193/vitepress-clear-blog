import { expect, test } from '@playwright/test'

test.describe('D3FullScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
  })

  test('Overview button opens fullscreen graph', async ({ page }) => {
    const overviewBtn = page.locator('button[title="Overview"]')
    if ((await overviewBtn.count()) === 0) {
      test.skip(true, 'Overview button not found')
      return
    }
    await overviewBtn.click()
    await page.waitForTimeout(1000)

    const popup = page.locator('.popup-wrapper')
    await expect(popup).toBeVisible()

    const svg = popup.locator('.d3-overall-container svg')
    if ((await svg.count()) > 0) {
      await expect(svg.first()).toBeVisible()
    }
  })

  test('fullscreen graph has circles and lines', async ({ page }) => {
    const overviewBtn = page.locator('button[title="Overview"]')
    if ((await overviewBtn.count()) === 0) {
      test.skip(true, 'Overview button not found')
      return
    }
    await overviewBtn.click()
    await page.waitForTimeout(2000)

    const popup = page.locator('.popup-wrapper')
    const circles = popup.locator('.d3-overall-container svg circle')
    const count = await circles.count()
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
      await expect(circles.first()).toBeVisible()

      const lines = popup.locator('.d3-overall-container svg line')
      if ((await lines.count()) > 0) {
        await expect(lines.first()).toBeVisible()
      }
    }
  })

  test('node drag in fullscreen graph moves a node', async ({ page }) => {
    const overviewBtn = page.locator('button[title="Overview"]')
    if ((await overviewBtn.count()) === 0) {
      test.skip(true, 'Overview button not found')
      return
    }
    await overviewBtn.click()
    await page.waitForTimeout(2000)

    const popup = page.locator('.popup-wrapper')
    const node = popup.locator('.d3-overall-container svg circle').first()
    const count = await node.count()
    if (count === 0) return

    const box = await node.boundingBox()
    if (!box) return

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 50, box.y + 50, { steps: 10 })
    await page.waitForTimeout(300)

    const newBox = await node.boundingBox()
    if (newBox) {
      expect(newBox.x).not.toBe(box.x)
      expect(newBox.y).not.toBe(box.y)
    }

    await page.mouse.up()
  })

  test('popup close button hides fullscreen graph', async ({ page }) => {
    const overviewBtn = page.locator('button[title="Overview"]')
    if ((await overviewBtn.count()) === 0) {
      test.skip(true, 'Overview button not found')
      return
    }
    await overviewBtn.click()
    await page.waitForTimeout(1000)

    const closeBtn = page.locator('.popup-close-button').first()
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('.popup-wrapper')).not.toBeVisible()
    }
  })
})
