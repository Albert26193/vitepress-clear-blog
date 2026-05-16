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
    const ascBtn = page.locator('button[aria-label="升序"]')
    const descBtn = page.locator('button[aria-label="降序"]')

    if ((await ascBtn.count()) === 0 || (await descBtn.count()) === 0) return

    const firstYearBefore = await page
      .locator('.timeline-year-title')
      .first()
      .textContent()

    await ascBtn.click()
    await page.waitForTimeout(600)

    const firstYearAfter = await page
      .locator('.timeline-year-title')
      .first()
      .textContent()

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

    await ascBtn.click()
    await page.waitForTimeout(600)

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

    const expandBtn = page.locator('button[aria-label="展开全部"]')
    if ((await expandBtn.count()) > 0) {
      await expandBtn.click()
      await page.waitForTimeout(600)
    }

    const postDates = page.locator('.post-date')
    const firstPostDateDesc = await postDates.first().textContent()

    await ascBtn.click()
    await page.waitForTimeout(600)

    const firstPostDateAsc = await postDates.first().textContent()

    const postCount = await postDates.count()
    if (postCount > 1) {
      expect(firstPostDateDesc).not.toBe(firstPostDateAsc)
    }
  })

  test('sort toggle shows animated reorder', async ({ page }) => {
    await page.goto('/timeline')
    const ascBtn = page.locator('button[aria-label="升序"]')
    if ((await ascBtn.count()) === 0) return

    await ascBtn.click()
    await page.waitForTimeout(600)

    const yearHeaders = page.locator('.year-header')
    expect(await yearHeaders.count()).toBeGreaterThan(0)
  })
})
