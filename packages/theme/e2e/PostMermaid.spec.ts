import { expect, test } from '@playwright/test'

test.describe('PostMermaid', () => {
  test('mermaid diagram renders as ASCII pre block', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const asciiBlock = page.locator('.mermaid-ascii').first()
    await expect(asciiBlock).toBeVisible()
    await expect(asciiBlock).toContainText('Start')
    await expect(asciiBlock).toContainText('Stop')
  })

  test('mermaid ASCII block has readable dimensions', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const asciiBlock = page.locator('.mermaid-ascii').first()
    await expect(asciiBlock).toBeVisible()

    const box = await asciiBlock.boundingBox()
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

  test('mermaid container exists on page', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
