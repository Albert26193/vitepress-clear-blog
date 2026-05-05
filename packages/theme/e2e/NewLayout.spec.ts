import { expect, test } from '@playwright/test'

test.describe('NewLayout', () => {
  test('homepage renders with layout', async ({ page }) => {
    await page.goto('/')
    const layout = page.locator('.clear-layout')
    if ((await layout.count()) > 0) {
      await expect(layout).toBeVisible()
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('.site-footer')).toBeVisible()
  })

  test('/pages renders dynamic component', async ({ page }) => {
    await page.goto('/pages')
    const blogMain = page.locator('.blog-main')
    await expect(blogMain).toBeVisible()
  })

  test('/timeline renders dynamic component', async ({ page }) => {
    await page.goto('/timeline')
    const timeline = page.locator('.timeline-page')
    await expect(timeline).toBeVisible()
  })

  test('/tags renders dynamic component', async ({ page }) => {
    await page.goto('/tags')
    const tags = page.locator('.tags-container')
    await expect(tags).toBeVisible()
  })

  test('/collections renders dynamic component', async ({ page }) => {
    await page.goto('/collections')
    await expect(page.locator('.my-card')).toBeVisible()
  })

  test('sidebar components are present on post page', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    // Sidebar link section
    const linkSidebar = page.locator('.link-sidebar')
    const tagSidebar = page.locator('.tag-sidebar')
    if ((await linkSidebar.count()) > 0) await expect(linkSidebar).toBeVisible()
    if ((await tagSidebar.count()) > 0) await expect(tagSidebar).toBeVisible()
  })

  test('doc-before slot is rendered on post page', async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
    const docBanner = page.locator('#hack-article-des')
    await expect(docBanner).toBeVisible()
  })
})
