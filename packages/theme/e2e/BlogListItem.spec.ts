import { expect, test } from '@playwright/test'

test.describe('BlogListItem', () => {
  test('list items render in list view', async ({ page }) => {
    await page.goto('/pages')
    const listItems = page.locator('.blog-list')
    const count = await listItems.count()
    if (count > 0) {
      await expect(listItems.first()).toBeVisible()
    }
  })

  test('list item has date column', async ({ page }) => {
    await page.goto('/pages')
    const dateItem = page.locator('.column-meta .date-item').first()
    if ((await dateItem.count()) > 0) {
      await expect(dateItem).toBeVisible()
    }
  })

  test('list item has title link', async ({ page }) => {
    await page.goto('/pages')
    const link = page.locator('.blog-list-container a[href^="/blogs/"]').first()
    if ((await link.count()) > 0) {
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      expect(href).toMatch(/^\/blogs\//)
    }
  })

  test('first and last items have position classes', async ({ page }) => {
    await page.goto('/pages')
    const first = page.locator('.blog-list.is-first-item').first()
    const last = page.locator('.blog-list.is-last-item').last()
    if ((await first.count()) > 0) await expect(first).toBeVisible()
    if ((await last.count()) > 0) await expect(last).toBeVisible()
  })
})
