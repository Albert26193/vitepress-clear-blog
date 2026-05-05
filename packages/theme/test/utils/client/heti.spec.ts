/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'

import { addClassForHetiElement } from '../../../src/utils/client/heti'

vi.mock('@vueuse/core', () => ({
  useScriptTag: () => ({
    load: vi.fn(() => Promise.resolve())
  })
}))

vi.mock('heti/umd/heti-addon.min.js?url', () => ({
  default: '/fake-heti.js'
}))

describe('addClassForHetiElement', () => {
  it('does not throw when no matching elements exist', () => {
    document.body.innerHTML = ''
    expect(() => addClassForHetiElement()).not.toThrow()
  })

  it('adds heti and heti--serif classes to matching elements', () => {
    document.body.innerHTML = `
      <div id="VPContent">
        <div class="VPDoc">
          <div class="content-container">
            <main class="main">Hello world</main>
          </div>
        </div>
      </div>
    `
    addClassForHetiElement()
    const main = document.querySelector('.main')
    expect(main?.classList.contains('heti')).toBe(true)
    expect(main?.classList.contains('heti--serif')).toBe(true)
  })

  it('handles multiple matching selectors', () => {
    document.body.innerHTML = `
      <div id="VPContent">
        <div class="VPDoc">
          <div class="content-container">
            <main class="main">Content</main>
          </div>
        </div>
      </div>
      <div class="VPSidebar">
        <nav id="VPSidebar">
          <a class="page-link" href="/">Home</a>
        </nav>
      </div>
    `
    addClassForHetiElement()
    const main = document.querySelector('.main')
    const pageLink = document.querySelector('.page-link')
    expect(main?.classList.contains('heti')).toBe(true)
    expect(pageLink?.classList.contains('heti')).toBe(true)
  })

  it('does not add classes to non-matching elements', () => {
    document.body.innerHTML = `
      <div class="random">Random content</div>
    `
    addClassForHetiElement()
    const random = document.querySelector('.random')
    expect(random?.classList.contains('heti')).toBe(false)
  })

  it('handles VPLocalNav elements', () => {
    document.body.innerHTML = `
      <div class="VPLocalNav">
        <div class="VPLocalNavOutlineDropdown">
          <div class="items">
            <div class="header">
              <a class="top-link">Top</a>
            </div>
            <div class="outline">
              <div class="VPDocOutlineItem">
                <a class="outline-link">Section</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    addClassForHetiElement()
    const topLink = document.querySelector('.top-link')
    const outlineLink = document.querySelector('.outline-link')
    expect(topLink?.classList.contains('heti')).toBe(true)
    expect(outlineLink?.classList.contains('heti')).toBe(true)
  })

  it('is idempotent - calling twice does not duplicate classes', () => {
    document.body.innerHTML = `
      <div id="VPContent">
        <div class="VPDoc">
          <div class="content-container">
            <main class="main">Content</main>
          </div>
        </div>
      </div>
    `
    addClassForHetiElement()
    addClassForHetiElement()
    const main = document.querySelector('.main')
    expect(main?.classList.contains('heti')).toBe(true)
  })
})

describe('registerHetiScript', () => {
  it('warns when Heti is not available', async () => {
    delete (window as any).Heti

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { registerHetiScript } =
      await import('../../../src/utils/client/heti')
    await registerHetiScript()

    expect(warnSpy).toHaveBeenCalledWith('Heti is not loaded yet')
    warnSpy.mockRestore()
  })

  it('initializes Heti when available and elements exist', async () => {
    const autoSpacing = vi.fn()
    ;(window as any).Heti = vi.fn(function () {
      return { autoSpacing }
    })

    document.body.innerHTML = `
      <div id="VPContent">
        <div class="VPDoc">
          <div class="content-container">
            <main class="main heti heti--serif">Content</main>
          </div>
        </div>
      </div>
    `

    const { registerHetiScript } =
      await import('../../../src/utils/client/heti')
    await registerHetiScript()

    expect((window as any).Heti).toHaveBeenCalledWith('.heti')
    expect(autoSpacing).toHaveBeenCalled()

    delete (window as any).Heti
  })
})
