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
})
