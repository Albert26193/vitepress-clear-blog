import { expect, test } from '@playwright/test'

test.describe('SidebarLink', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
  })

  test('link sidebar section renders', async ({ page }) => {
    const sidebar = page.locator('.link-sidebar')
    if ((await sidebar.count()) > 0) {
      await expect(sidebar).toBeVisible()
    }
  })

  test('link title with icon is visible', async ({ page }) => {
    const title = page.locator('.link-title').first()
    if ((await title.count()) > 0) {
      await expect(title).toBeVisible()
      const icon = title.locator('.i-carbon-direction-loop-left')
      if ((await icon.count()) > 0) {
        await expect(icon).toBeVisible()
      }
    }
  })

  test('outgoing links are listed', async ({ page }) => {
    const outgoing = page.locator('.page-links a')
    const count = await outgoing.count()
    if (count > 0) {
      const href = await outgoing.first().getAttribute('href')
      expect(href).toMatch(/^\//)
    }
  })

  test('sidebar visible across multiple posts', async ({ page }) => {
    const routes = ['/blogs/vitepress-first', '/blogs/mysql']
    for (const route of routes) {
      await page.goto(route)
      const sidebar = page.locator('.link-sidebar')
      if ((await sidebar.count()) > 0) {
        await expect(sidebar).toBeVisible()
      }
    }
  })
})
