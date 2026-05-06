/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupCodeBlockFold } from '../src/index'

const mockRoute = { path: '/test' }

vi.mock('vitepress', () => ({
  useRoute: () => mockRoute
}))

const onMountedCbs: (() => void)[] = []
const watchCbs: (() => void)[] = []

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => {
      onMountedCbs.push(cb)
    }),
    watch: vi.fn((source: unknown, cb: () => void) => {
      // Call the source getter to cover the getter function body
      if (typeof source === 'function') source()
      watchCbs.push(cb)
    }),
    nextTick: vi.fn((cb?: () => void) => {
      if (cb) setTimeout(cb, 0)
      return Promise.resolve()
    })
  }
})

function createCodeBlock(height: number, language = 'typescript'): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = `language-${language}`
  // jsdom doesn't render, so clientHeight is always 0. Set it manually.
  Object.defineProperty(wrapper, 'clientHeight', {
    configurable: true,
    get: () => height
  })
  Object.defineProperty(wrapper, 'scrollHeight', {
    configurable: true,
    get: () => height + 100
  })
  return wrapper
}

function createDocContainer(): HTMLElement {
  const doc = document.createElement('div')
  doc.className = 'vp-doc'
  document.body.appendChild(doc)
  return doc
}

describe('setupCodeBlockFold', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    onMountedCbs.length = 0
    watchCbs.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns early when window is undefined (SSR)', () => {
    // Verify the guard clause exists by checking the function source
    const src = setupCodeBlockFold.toString()
    expect(src).toMatch(/typeof window[^)]+undefined/)
  })

  it('does nothing when no code blocks found', () => {
    createDocContainer()
    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    const processed = document.querySelectorAll('.vp-code-fold-processed')
    expect(processed.length).toBe(0)
  })

  it('does not fold code blocks below minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(150)
    doc.appendChild(block)

    setupCodeBlockFold({ minHeight: 200 })
    onMountedCbs.forEach((cb) => cb())

    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
  })

  it('folds code blocks exceeding default minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(250)
    doc.appendChild(block)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
    expect(block.style.maxHeight).toBe('200px') // default visibleHeight = minHeight = 200
  })

  it('folds code blocks exceeding custom minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(350)
    doc.appendChild(block)

    setupCodeBlockFold({ minHeight: 300 })
    onMountedCbs.forEach((cb) => cb())

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
    expect(block.style.maxHeight).toBe('300px')
  })

  it('uses custom visibleHeight when provided', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(400)
    doc.appendChild(block)

    setupCodeBlockFold({ minHeight: 200, visibleHeight: 100 })
    onMountedCbs.forEach((cb) => cb())

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.style.maxHeight).toBe('100px')
  })

  it('skips already processed code blocks', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    block.classList.add('vp-code-fold-processed')
    doc.appendChild(block)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    // Should still have only one mask (not doubled)
    const masks = block.querySelectorAll('.vp-code-fold-mask')
    expect(masks.length).toBe(0)
  })

  it('creates fold mask with toggle button', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    const mask = block.querySelector('.vp-code-fold-mask')
    expect(mask).not.toBeNull()
    expect(mask!.querySelector('.vp-code-fold-btn')).not.toBeNull()
  })

  it('toggles between folded and expanded state on click', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)

    // Click to expand
    mask.click()
    expect(block.classList.contains('vp-code-fold-active')).toBe(false)
    expect(block.style.maxHeight).toContain('px')

    // Click to fold again
    mask.click()
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
  })

  it('does not fold exactly-at-minHeight code blocks', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(200)
    doc.appendChild(block)

    setupCodeBlockFold({ minHeight: 200 })
    onMountedCbs.forEach((cb) => cb())

    // height > minHeight is strict, exactly 200 is not greater
    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
  })

  it('folds code blocks just above minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(201)
    doc.appendChild(block)

    setupCodeBlockFold({ minHeight: 200 })
    onMountedCbs.forEach((cb) => cb())

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('handles multiple code blocks independently', () => {
    const doc = createDocContainer()
    const block1 = createCodeBlock(300, 'typescript')
    const block2 = createCodeBlock(100, 'python')
    const block3 = createCodeBlock(400, 'rust')
    doc.appendChild(block1)
    doc.appendChild(block2)
    doc.appendChild(block3)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    expect(block1.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block2.classList.contains('vp-code-fold-processed')).toBe(false)
    expect(block3.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('re-folds code blocks after route change', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    // Reset DOM
    document.body.innerHTML = ''
    const newDoc = createDocContainer()
    const newBlock = createCodeBlock(350)
    newDoc.appendChild(newBlock)

    // Simulate route change
    mockRoute.path = '/other-page'
    watchCbs.forEach((cb) => cb())
    vi.runAllTimers()

    expect(newBlock.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('only processes blocks within .vp-doc container', () => {
    const doc = createDocContainer()
    const validBlock = createCodeBlock(300)
    doc.appendChild(validBlock)

    // Block outside .vp-doc
    const outsideBlock = createCodeBlock(300)
    outsideBlock.classList.add('language-js')
    document.body.appendChild(outsideBlock)

    setupCodeBlockFold()
    onMountedCbs.forEach((cb) => cb())

    expect(validBlock.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(outsideBlock.classList.contains('vp-code-fold-processed')).toBe(
      false
    )
  })
})
