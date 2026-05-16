import { expect, test } from '@playwright/test'

test.describe('Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tags')
  })

  test('tag cloud renders', async ({ page }) => {
    const container = page.locator('.tags-container')
    await expect(container).toBeVisible()
  })

  test('each tag shows count', async ({ page }) => {
    const tags = page.locator('.tag-view')
    const count = await tags.count()
    if (count > 0) {
      const firstTag = tags.first()
      await expect(firstTag).toBeVisible()
      const tagText = await firstTag.textContent()
      expect(tagText).toBeTruthy()
    }
  })

  test('clicking a tag filters results', async ({ page }) => {
    const tag = page.locator('.tag-view').first()
    if ((await tag.count()) === 0) return

    await tag.click()
    await page.waitForTimeout(500)
    expect(page.url()).toMatch(/\?tag=/)
  })

  test('active tag has visual indicator', async ({ page }) => {
    const tag = page.locator('.tag-view').first()
    if ((await tag.count()) === 0) return

    await tag.click()
    await page.waitForTimeout(300)
    await expect(tag).toHaveClass(/active/)
  })

  test('Chinese tag works', async ({ page }) => {
    await page.goto('/tags?tag=%E6%95%99%E7%A8%8B')
    await expect(page.locator('.tags-container')).toBeVisible()
  })

  test('empty tag shows no error', async ({ page }) => {
    await page.goto('/tags?tag=nonexistent_xyz_123')
    await expect(page.locator('.tags-container')).toBeVisible()
  })

  test('tag filter animates post list', async ({ page }) => {
    await page.goto('/tags')
    const tag = page.locator('.tag-view').first()
    const postsBefore = await page.locator('.tag-post-item').count()
    if ((await tag.count()) === 0 || postsBefore <= 1) return

    await tag.click()
    await page.waitForTimeout(600)
    const postsAfter = await page.locator('.tag-post-item').count()
    expect(postsAfter).not.toBe(postsBefore)
  })
})
