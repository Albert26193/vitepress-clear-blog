import { expect, test } from '@playwright/test'

test.describe('CopyMdButton', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blogs/vitepress-first')
  })

  test('button renders in the doc banner meta row', async ({ page }) => {
    const button = page.locator('.copy-md-button')
    await expect(button).toBeVisible({ timeout: 10000 })
    await expect(button.locator('.copy-md-label')).toHaveText('MD for LLM')
  })

  test('clicking copies the llms sibling .md to the clipboard', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const button = page.locator('.copy-md-button')
    await button.click()
    // Success feedback: icon flips to a checkmark for ~2s
    await expect(
      page.locator('.copy-md-button .i-carbon-checkmark')
    ).toBeVisible()
    await expect(button.locator('.copy-md-label')).toHaveText('Copied')
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    // The llms .md rewrites frontmatter to url + description
    expect(clipboard).toContain('url:')
    expect(clipboard.length).toBeGreaterThan(50)
  })

  test('label collapses to icon-only on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const button = page.locator('.copy-md-button')
    await expect(button).toBeVisible()
    await expect(button.locator('.copy-md-label')).toBeHidden()
  })
})
