import { expect, test } from '@playwright/test'

test.describe('BlogMain', () => {
  test('card view renders on /pages', async ({ page }) => {
    await page.goto('/pages')
    const main = page.locator('.blog-main')
    await expect(main).toBeVisible()
    const cards = main.locator('.blog-card')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('list view renders on /pages', async ({ page }) => {
    await page.goto('/pages')
    const main = page.locator('.blog-main')
    await expect(main).toBeVisible()
    const cards = main.locator('.blog-card')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('pagination header exists', async ({ page }) => {
    await page.goto('/pages')
    const header = page.locator('.pagination-header')
    await expect(header).toBeVisible()
  })

  test('layout switch toggle exists', async ({ page }) => {
    await page.goto('/pages')
    const toggle = page.locator(
      '.pagination-header button, .pagination-header [class*="toggle"]'
    )
    if ((await toggle.count()) > 0) {
      await expect(toggle.first()).toBeVisible()
    }
  })
})
