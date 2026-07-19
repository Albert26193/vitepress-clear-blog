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
      // Should contain the tag name
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

  test.describe('mobile collapse', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/tags')
    })

    test('tag cloud is clamped and toggle shows total count', async ({
      page
    }) => {
      const container = page.locator('.tags-container')
      await expect(container).toBeVisible()

      const toggle = page.locator('.tags-toggle')
      await expect(toggle).toBeVisible()
      await expect(toggle).toHaveText(/Show all \(\d+\)/)

      // Clamped: rendered box is shorter than the full tag list
      const box = await container.boundingBox()
      const scrollHeight = await container.evaluate((el) => el.scrollHeight)
      expect(box!.height).toBeLessThan(scrollHeight)
    })

    test('toggle expands to full list and collapses back', async ({ page }) => {
      const container = page.locator('.tags-container')
      const toggle = page.locator('.tags-toggle')
      await expect(toggle).toBeVisible()
      const collapsedHeight = (await container.boundingBox())!.height

      await toggle.click()
      await expect(toggle).toHaveText('Show less')
      const expandedHeight = (await container.boundingBox())!.height
      const scrollHeight = await container.evaluate((el) => el.scrollHeight)
      expect(expandedHeight).toBeGreaterThan(collapsedHeight)
      expect(Math.round(expandedHeight)).toBeGreaterThanOrEqual(
        scrollHeight - 2
      )

      await toggle.click()
      await expect(toggle).toHaveText(/Show all \(\d+\)/)
      const recollapsedHeight = (await container.boundingBox())!.height
      expect(recollapsedHeight).toBeLessThan(expandedHeight)
    })

    test('tag filtering still works while collapsed', async ({ page }) => {
      const tag = page.locator('.tag-view').first()
      await tag.click()
      await page.waitForTimeout(500)
      expect(page.url()).toMatch(/\?tag=/)
      await expect(tag).toHaveClass(/active/)
    })

    test('toggle hidden at desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/tags')
      await expect(page.locator('.tags-container')).toBeVisible()
      await expect(page.locator('.tags-toggle')).toBeHidden()
    })
  })
})
