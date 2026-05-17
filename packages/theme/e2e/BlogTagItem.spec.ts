import { expect, test } from '@playwright/test'

test.describe('BlogTagItem', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tags')
  })

  test('renders tag text and count', async ({ page }) => {
    const tag = page.locator('.tag-view').first()
    await expect(tag).toBeVisible()
    await expect(tag.locator('.count')).toBeVisible()
    await expect(tag).toContainText(/\S+/)
  })

  test('clicking a tag toggles active state and URL query', async ({
    page
  }) => {
    const tag = page.locator('.tag-view').first()
    await expect(tag).toBeVisible()

    await tag.click()
    await expect(tag).toHaveClass(/active/)
    expect(page.url()).toContain('?tag=')

    await tag.click()
    await expect(tag).not.toHaveClass(/active/)
    expect(page.url()).not.toContain('?tag=')
  })

  test('clicking a tag updates the selected tag header', async ({ page }) => {
    const tag = page.locator('.tag-view').first()
    await expect(tag).toBeVisible()
    const tagName = await tag.evaluate((element) => {
      return Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join('')
        .trim()
    })

    await tag.click()
    await expect(page.locator('.tag-header')).toContainText(tagName)
  })
})
