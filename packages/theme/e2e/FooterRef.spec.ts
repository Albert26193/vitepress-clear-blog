import { expect, test } from '@playwright/test'

test.describe('FooterRef', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/footnote-test')
  })

  test('footnote references are rendered', async ({ page }) => {
    const refs = page.locator('.footnote-ref')
    await expect(refs.first()).toBeVisible()
  })

  test('footnote badge has text', async ({ page }) => {
    const badge = page.locator('.footnote-badge').first()
    await expect(badge).toBeVisible()
    await expect(badge).not.toHaveText('')
  })

  test('hover reveals tooltip with footnote content', async ({ page }) => {
    const ref = page.locator('.footnote-ref').first()
    await expect(ref).toBeVisible()

    await ref.hover()

    const tooltip = page.locator('.footnote-tooltip').first()
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('这是第一个脚注')
  })

  test('repeated footnote backlinks target unique references', async ({
    page
  }) => {
    const repeatedRef = page.locator('#fnref4\\:3')
    await expect(repeatedRef).toHaveCount(1)

    const backlink = page.locator('a[href="#fnref4:3"]').first()
    await expect(backlink).toBeVisible()

    await backlink.click()
    await expect(repeatedRef).toBeVisible()
  })

  test('tooltip disappears on mouse leave', async ({ page }) => {
    const ref = page.locator('.footnote-ref').first()
    await expect(ref).toBeVisible()

    await ref.hover()
    const tooltip = page.locator('.footnote-tooltip').first()
    await expect(tooltip).toBeVisible()

    await page.mouse.move(0, 0)
    await expect(tooltip).not.toBeVisible()
  })
})
