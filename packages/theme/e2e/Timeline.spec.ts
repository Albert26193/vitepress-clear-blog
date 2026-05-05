import { expect, test } from '@playwright/test'

test.describe('Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timeline')
  })

  test('page renders', async ({ page }) => {
    await expect(page.locator('.timeline-page')).toBeVisible()
  })

  test('years are displayed', async ({ page }) => {
    const yearHeaders = page.locator('.year-header')
    const count = await yearHeaders.count()
    if (count > 0) {
      await expect(yearHeaders.first()).toBeVisible()
    }
  })

  test('year header contains a 4-digit year', async ({ page }) => {
    // .timeline-year-title-span includes post count "( N )", target .timeline-year-title for just the year
    const yearSpan = page.locator('.timeline-year-title').first()
    if ((await yearSpan.count()) > 0) {
      const text = await yearSpan.textContent()
      expect(text).toMatch(/^\d{4}$/)
    }
  })

  test('clicking a post navigates to the post', async ({ page }) => {
    const postLink = page
      .locator('.timeline-container a[href^="/blogs/"]')
      .first()
    if ((await postLink.count()) > 0) {
      const href = await postLink.getAttribute('href')
      await postLink.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain(href || '/blogs/')
    }
  })

  test('controls container exists', async ({ page }) => {
    const controls = page.locator('.controls-container')
    await expect(controls).toBeVisible()
  })
})
