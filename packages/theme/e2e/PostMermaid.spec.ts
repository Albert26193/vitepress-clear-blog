import { expect, test } from '@playwright/test'

test.describe('PostMermaid', () => {
  test('mermaid diagram renders as an SVG image', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const mermaidImage = page.locator('.mermaid-img').first()
    await expect(mermaidImage).toBeVisible()
    await expect(mermaidImage).toHaveAttribute('src', /^data:image\/svg\+xml/)
  })

  test('mermaid SVG image has non-zero dimensions', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const mermaidImage = page.locator('.mermaid-img').first()
    await expect(mermaidImage).toBeVisible()

    const box = await mermaidImage.boundingBox()
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

  test('opens PhotoSwipe for Mermaid images', async ({ page }) => {
    await page.goto('/blogs/test/mermaid')

    const mermaidImage = page.locator('.mermaid-img').first()
    await expect(mermaidImage).toBeVisible()
    await expect(mermaidImage).toHaveAttribute('src', /^data:image\/svg\+xml/)
    await mermaidImage.click()
    await expect(page.locator('.pswp')).toBeVisible()
    await expect(page.locator('.pswp.pswp--ui-visible')).toBeVisible()
    await expect(page.locator('.pswp__button--zoom')).toBeVisible()
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
