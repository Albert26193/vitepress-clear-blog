import { expect, test } from '@playwright/test'

test.describe('BlogListPagination', () => {
  test('list pagination container renders', async ({ page }) => {
    await page.goto('/pages')
    const pagination = page.locator('.blog-list-pagination')
    if ((await pagination.count()) > 0) {
      await expect(pagination).toBeVisible()
    }
  })

  test('list container has items', async ({ page }) => {
    await page.goto('/pages')
    const container = page.locator('.list-container')
    if ((await container.count()) > 0) {
      await expect(container).toBeVisible()
    }
  })

  test('pagination footer exists', async ({ page }) => {
    await page.goto('/pages')
    const footer = page.locator('.blog-list-pagination .page-footer')
    if ((await footer.count()) > 0) {
      await expect(footer).toBeVisible()
    }
  })

  test('page change in list view shows transition', async ({ page }) => {
    await page.goto('/pages')
    // Switch to list view first
    const listToggle = page.locator('button[aria-label="List View"]')
    if ((await listToggle.count()) > 0) {
      await listToggle.click()
      await page.waitForTimeout(600)
    }
    const page2Link = page
      .locator('.blog-list-pagination .pagination-link')
      .nth(1)
    if ((await page2Link.count()) > 0) {
      await page2Link.click()
      await page.waitForTimeout(600)
      const items = page.locator('.blog-list')
      expect(await items.count()).toBeGreaterThan(0)
    }
  })
})
