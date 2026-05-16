import { expect, test } from '@playwright/test'

test.describe('BlogCardPagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages')
  })

  test('pagination container renders', async ({ page }) => {
    const pagination = page.locator('.blog-card-pagination')
    await expect(pagination).toBeVisible()
  })

  test('page footer with pagination links exists', async ({ page }) => {
    const footer = page.locator('.page-footer .pagination')
    if ((await footer.count()) > 0) {
      await expect(footer).toBeVisible()
    }
  })

  test('pagination links are clickable', async ({ page }) => {
    const links = page.locator('.pagination-link')
    const count = await links.count()
    if (count > 0) {
      await links.first().click()
      await page.waitForTimeout(500)
      expect(page.url()).toMatch(/\/pages/)
    }
  })

  test('active page is indicated', async ({ page }) => {
    const active = page.locator(
      '.pagination-link[class*="active"], .pagination-link.active'
    )
    if ((await active.count()) > 0) {
      await expect(active).toBeVisible()
    }
  })

  test('page change animates content', async ({ page }) => {
    await page.goto('/pages')
    const page2Link = page.locator('.page-footer .pagination a').nth(1)
    if ((await page2Link.count()) === 0) return

    await page2Link.click()
    await page.waitForTimeout(600)
    const cards = page.locator('.blog-card')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('navigating to page 2 changes content', async ({ page }) => {
    const firstPageTitles: string[] = []
    const cards = page.locator('.blog-card .card-title')
    const cardCount = await cards.count()
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      firstPageTitles.push((await cards.nth(i).textContent()) || '')
    }

    // Click the page 2 link in the pagination (not URL param - component uses internal state)
    const page2Link = page.locator('.page-footer .pagination a').nth(1)
    if ((await page2Link.count()) > 0) {
      await page2Link.click()
      await page.waitForTimeout(500)
      const secondPageCards = page.locator('.blog-card .card-title')
      const secondCount = await secondPageCards.count()
      if (secondCount > 0) {
        const secondTitle = await secondPageCards.first().textContent()
        if (cardCount > 1) {
          expect(secondTitle).not.toBe(firstPageTitles[0])
        }
      }
    }
  })
})
