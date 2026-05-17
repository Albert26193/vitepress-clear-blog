import { expect, test } from '@playwright/test'

test.describe('PaginationFooter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages')
  })

  test('renders page links with active page', async ({ page }) => {
    const links = page.locator('.blog-card-pagination .pagination-link')
    const count = await links.count()
    if (count === 0) return

    await expect(links.first()).toBeVisible()
    await expect(links.first()).toHaveText('1')
    await expect(links.first()).toHaveClass(/active/)
  })

  test('clicking another page updates the active link', async ({ page }) => {
    const links = page.locator('.blog-card-pagination .pagination-link')
    const count = await links.count()
    if (count < 2) return

    await links.nth(1).click()
    await expect(links.nth(1)).toHaveClass(/active/)
    await expect(links.first()).not.toHaveClass(/active/)
  })

  test('active page click keeps the same content', async ({ page }) => {
    const active = page.locator('.blog-card-pagination .pagination-link.active')
    if ((await active.count()) === 0) return

    const firstTitle = page.locator('.blog-card .card-title').first()
    await expect(firstTitle).toBeVisible()
    const titleBefore = await firstTitle.textContent()

    await active.click()
    await expect(firstTitle).toHaveText(titleBefore || '')
  })
})
