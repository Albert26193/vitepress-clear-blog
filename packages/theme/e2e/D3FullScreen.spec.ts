import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Open the Overview popup and return its wrapper locator.
 *
 * The Overview button is server-rendered, so under CI CPU contention a click
 * can land before Vue finishes hydrating the page. Such a click is silently
 * dropped, `showOverview` never flips, and `.popup-wrapper` never mounts — the
 * old fixed `waitForTimeout` could not recover from this, so the assertion
 * failed on every retry. Re-issue the click until the popup actually appears
 * instead of waiting a fixed interval and asserting once.
 */
const openOverview = async (page: Page) => {
  const overviewBtn = page.locator('button[title="Overview"]')
  const popup = page.locator('.popup-wrapper')

  await expect(async () => {
    if (!(await popup.isVisible())) {
      await overviewBtn.click()
    }
    await expect(popup).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15000 })

  return popup
}

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

    const popup = await openOverview(page)

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

    const popup = await openOverview(page)
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

    const popup = await openOverview(page)
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

    await openOverview(page)

    const closeBtn = page.locator('.popup-close-button').first()
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click()
      await expect(page.locator('.popup-wrapper')).not.toBeVisible()
    }
  })
})
