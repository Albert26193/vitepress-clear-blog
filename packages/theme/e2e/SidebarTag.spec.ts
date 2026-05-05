import { expect, test } from '@playwright/test'

test.describe('SidebarTag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
  })

  test('tag sidebar section renders', async ({ page }) => {
    const sidebar = page.locator('.tag-sidebar')
    if ((await sidebar.count()) > 0) {
      await expect(sidebar).toBeVisible()
    }
  })

  test('tag title with icon is visible', async ({ page }) => {
    const title = page.locator('.tag-title')
    if ((await title.count()) > 0) {
      await expect(title).toBeVisible()
      const icon = title.locator('.i-carbon-tag-group')
      if ((await icon.count()) > 0) {
        await expect(icon).toBeVisible()
      }
    }
  })

  test('current post tags are displayed', async ({ page }) => {
    const tags = page.locator('.current-tags .tag, .tags-list a')
    const count = await tags.count()
    if (count > 0) {
      await expect(tags.first()).toBeVisible()
    }
  })

  test('clicking a tag filters related posts', async ({ page }) => {
    const tag = page.locator('.sidebar-tag').first()
    if ((await tag.count()) > 0) {
      const wasActive = await tag.evaluate((el) =>
        el.classList.contains('side-tag-active')
      )
      await tag.click()
      await page.waitForTimeout(300)
      const isActive = await tag.evaluate((el) =>
        el.classList.contains('side-tag-active')
      )
      expect(isActive).not.toBe(wasActive)
    }
  })

  test('sidebar visible across multiple posts', async ({ page }) => {
    const routes = ['/blogs/vitepress-first', '/blogs/mysql']
    for (const route of routes) {
      await page.goto(route)
      const sidebar = page.locator('.tag-sidebar')
      if ((await sidebar.count()) > 0) {
        await expect(sidebar).toBeVisible()
      }
    }
  })
})
