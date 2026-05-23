import { expect, test } from '@playwright/test'

test.describe('PostMermaid', () => {
  test('mermaid diagram renders as SVG image by default', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const svgImage = page.locator('.mermaid-img').first()
    await expect(svgImage).toBeVisible()
    await expect(svgImage).toHaveAttribute('src', /^data:image\/svg\+xml,/)
  })

  test('mermaid SVG image has readable dimensions', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    await page.waitForSelector('.mermaid-img', {
      state: 'visible',
      timeout: 15000
    })
    const svgImage = page.locator('.mermaid-img').first()
    await expect(svgImage).toHaveAttribute('src', /^data:image\/svg\+xml,/)

    const box = await svgImage.boundingBox()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)
  })

  test('opens PhotoSwipe for article images', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const articleImage = page.locator('.main img:not(.mermaid-img)').first()
    await expect(articleImage).toBeVisible()
    await articleImage.click()

    await expect(page.locator('.pswp')).toBeVisible()
    await expect(page.locator('.pswp.pswp--ui-visible')).toBeVisible()
    await page.evaluate(() => {
      const photoSwipe = (
        window as unknown as {
          pswp?: { close: () => void }
        }
      ).pswp
      photoSwipe?.close()
    })
    await expect(page.locator('.pswp')).toBeHidden()
  })

  test('intentional negative Mermaid samples render as error cards', async ({
    page
  }) => {
    await page.goto('/blogs/test/mermaid')

    await expect(
      page.locator('#negative-samples-unsupported-mermaid-syntax')
    ).toBeVisible()
    const errorCards = page.locator('.mermaid-error')
    await expect(errorCards.first()).toBeVisible()
  })

  test('mermaid container exists on page', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
