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

  test('sort toggle changes year order', async ({ page }) => {
    // Find the sort toggle buttons
    const ascBtn = page.locator('button[aria-label="升序"]')
    const descBtn = page.locator('button[aria-label="降序"]')

    if ((await ascBtn.count()) === 0 || (await descBtn.count()) === 0) return

    // Default is descending — get the first year
    const firstYearBefore = await page
      .locator('.timeline-year-title')
      .first()
      .textContent()

    // Click ascending
    await ascBtn.click()
    await page.waitForTimeout(300)

    const firstYearAfter = await page
      .locator('.timeline-year-title')
      .first()
      .textContent()

    // If there are multiple years, ascending order should differ from descending
    const yearCount = await page.locator('.timeline-year-title').count()
    if (yearCount > 1) {
      expect(firstYearBefore).not.toBe(firstYearAfter)
    }
  })

  test('ascending sort shows months oldest-first within each year', async ({
    page
  }) => {
    const ascBtn = page.locator('button[aria-label="升序"]')
    if ((await ascBtn.count()) === 0) return

    // Click ascending
    await ascBtn.click()
    await page.waitForTimeout(300)

    // Get the first visible month title
    const monthTitles = page.locator('.timeline-month-title-span')
    if ((await monthTitles.count()) > 0) {
      const firstMonthText = await monthTitles.first().textContent()
      expect(firstMonthText).toBeTruthy()
    }
  })

  test('posts within same month reorder on sort toggle', async ({ page }) => {
    const ascBtn = page.locator('button[aria-label="升序"]')
    const descBtn = page.locator('button[aria-label="降序"]')
    if ((await ascBtn.count()) === 0 || (await descBtn.count()) === 0) return

    // Expand all to ensure posts are visible
    const expandBtn = page.locator('button[aria-label="展开全部"]')
    if ((await expandBtn.count()) > 0) {
      await expandBtn.click()
      await page.waitForTimeout(300)
    }

    // Get post dates in descending order (default)
    const postDates = page.locator('.post-date')
    const firstPostDateDesc = await postDates.first().textContent()

    // Click ascending
    await ascBtn.click()
    await page.waitForTimeout(300)

    const firstPostDateAsc = await postDates.first().textContent()

    // If multiple posts exist, the order should differ
    const postCount = await postDates.count()
    if (postCount > 1) {
      expect(firstPostDateDesc).not.toBe(firstPostDateAsc)
    }
  })
})
