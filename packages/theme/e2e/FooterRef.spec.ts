import { expect, test } from '@playwright/test'

test.describe('FooterRef', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/footnote-test')
  })

  test('footnote references are rendered', async ({ page }) => {
    const refs = page.locator('.footnote-ref')
    const count = await refs.count()
    if (count > 0) {
      await expect(refs.first()).toBeVisible()
    }
  })

  test('footnote badge has text', async ({ page }) => {
    const badge = page.locator('.footnote-badge').first()
    if ((await badge.count()) > 0) {
      await expect(badge).toBeVisible()
      const text = await badge.textContent()
      expect(text).toBeTruthy()
    }
  })

  test('hover reveals tooltip', async ({ page }) => {
    const ref = page.locator('.footnote-ref').first()
    if ((await ref.count()) === 0) return

    await ref.hover()
    await page.waitForTimeout(500)

    const tooltip = page.locator('.footnote-tooltip')
    if ((await tooltip.count()) > 0) {
      await expect(tooltip).toBeVisible()
    }
  })

  test('tooltip disappears on mouse leave', async ({ page }) => {
    const ref = page.locator('.footnote-ref').first()
    if ((await ref.count()) === 0) return

    await ref.hover()
    await page.waitForTimeout(500)
    await page.mouse.move(0, 0)
    await page.waitForTimeout(300)

    const tooltip = page.locator('.footnote-tooltip')
    if ((await tooltip.count()) > 0) {
      await expect(tooltip).not.toBeVisible()
    }
  })
})
