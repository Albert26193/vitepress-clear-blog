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
const onUnmountedCbs: (() => void)[] = []
const watchCbs: (() => void)[] = []
const watchStopCbs: ReturnType<typeof vi.fn>[] = []

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => {
      onMountedCbs.push(cb)
    }),
    onUnmounted: vi.fn((cb: () => void) => {
      onUnmountedCbs.push(cb)
    }),
    watch: vi.fn((source: unknown, cb: () => void) => {
      if (typeof source === 'function') source()
      watchCbs.push(cb)
      const stop = vi.fn()
      watchStopCbs.push(stop)
      return stop
    }),
    nextTick: vi.fn((cb?: () => void) => {
      cb?.()
      return Promise.resolve()
    })
  }
})

class MockMutationObserver {
  static instances: MockMutationObserver[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(private readonly callback: MutationCallback) {
    MockMutationObserver.instances.push(this)
  }

  trigger() {
    this.callback([], this as unknown as MutationObserver)
  }
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(private readonly callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this)
  }

  trigger() {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function createCodeBlock(height: number, language = 'typescript'): HTMLElement {
  return createMutableCodeBlock({ height, language })
}

function createMutableCodeBlock({
  height,
  language = 'typescript',
  scrollHeight = height + 100
}: {
  height: number
  language?: string
  scrollHeight?: number
}): HTMLElement & {
  setHeights: (nextHeight: number, nextScroll?: number) => void
} {
  let currentHeight = height
  let currentScrollHeight = scrollHeight
  const wrapper = document.createElement('div') as unknown as HTMLElement & {
    setHeights: (nextHeight: number, nextScroll?: number) => void
  }

  wrapper.className = `language-${language}`
  wrapper.setHeights = (nextHeight: number, nextScroll = nextHeight + 100) => {
    currentHeight = nextHeight
    currentScrollHeight = nextScroll
  }

  Object.defineProperty(wrapper, 'clientHeight', {
    configurable: true,
    get: () => currentHeight
  })
  Object.defineProperty(wrapper, 'scrollHeight', {
    configurable: true,
    get: () => currentScrollHeight
  })

  return wrapper
}

function createDocContainer(): HTMLElement {
  const doc = document.createElement('div')
  doc.className = 'vp-doc'
  document.body.appendChild(doc)
  return doc
}

function mountCodeBlockFold(options = {}) {
  setupCodeBlockFold(options)
  onMountedCbs.forEach((cb) => cb())
}

describe('setupCodeBlockFold', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockRoute.path = '/test'
    onMountedCbs.length = 0
    onUnmountedCbs.length = 0
    watchCbs.length = 0
    watchStopCbs.length = 0
    MockMutationObserver.instances.length = 0
    MockResizeObserver.instances.length = 0
    globalThis.MutationObserver =
      MockMutationObserver as unknown as typeof MutationObserver
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns early when window is undefined (SSR)', () => {
    const src = setupCodeBlockFold.toString()
    expect(src).toMatch(/typeof window[^)]+undefined/)
    expect(src).toMatch(/typeof document[^)]+undefined/)
  })

  it('does nothing when no code blocks found', () => {
    createDocContainer()
    mountCodeBlockFold()

    const processed = document.querySelectorAll('.vp-code-fold-processed')
    expect(processed.length).toBe(0)
  })

  it('does nothing without a .vp-doc container', () => {
    mountCodeBlockFold()

    expect(MockMutationObserver.instances.length).toBe(0)
    expect(document.querySelectorAll('.vp-code-fold-processed').length).toBe(0)
  })

  it('does not fold code blocks below minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(150)
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 200 })

    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
  })

  it('folds code blocks exceeding default minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(250)
    doc.appendChild(block)

    mountCodeBlockFold()

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
    expect(block.style.maxHeight).toBe('130px')
  })

  it('folds code blocks exceeding custom minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(350)
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 300 })

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
    expect(block.style.maxHeight).toBe('130px')
  })

  it('returns early when visibleHeight is not smaller than minHeight', () => {
    setupCodeBlockFold({ minHeight: 100, visibleHeight: 100 })

    // Function returns immediately without setting up, no observable effect
    // but it should not throw
  })

  it('uses custom visibleHeight when provided', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(400)
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 200, visibleHeight: 100 })

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block.style.maxHeight).toBe('100px')
  })

  it('skips already processed code blocks', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    block.classList.add('vp-code-fold-processed')
    doc.appendChild(block)

    mountCodeBlockFold()

    const masks = block.querySelectorAll('.vp-code-fold-mask')
    expect(masks.length).toBe(0)
  })

  it('creates fold mask with toggle button', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask')
    expect(mask).not.toBeNull()
    expect(mask!.querySelector('.vp-code-fold-btn')).not.toBeNull()
  })

  it('sets aria attributes on fold mask', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(mask.getAttribute('role')).toBe('button')
    expect(mask.getAttribute('tabindex')).toBe('0')
    expect(mask.getAttribute('aria-expanded')).toBe('false')
    expect(mask.getAttribute('aria-label')).toBe('Expand code block')
  })

  it('updates aria attributes on toggle', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement

    mask.click()
    expect(mask.getAttribute('aria-expanded')).toBe('true')
    expect(mask.getAttribute('aria-label')).toBe('Collapse code block')

    mask.click()
    expect(mask.getAttribute('aria-expanded')).toBe('false')
    expect(mask.getAttribute('aria-label')).toBe('Expand code block')
  })

  it('toggles on Enter key', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(mask.getAttribute('aria-expanded')).toBe('false')

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    mask.dispatchEvent(event)
    expect(mask.getAttribute('aria-expanded')).toBe('true')
  })

  it('toggles on Space key', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(mask.getAttribute('aria-expanded')).toBe('false')

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    mask.dispatchEvent(event)
    expect(mask.getAttribute('aria-expanded')).toBe('true')
  })

  it('ignores non-activation keys on keydown', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(mask.getAttribute('aria-expanded')).toBe('false')

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    mask.dispatchEvent(event)
    expect(mask.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles between folded and expanded state on click', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)

    mask.click()
    expect(block.classList.contains('vp-code-fold-active')).toBe(false)
    expect(block.style.maxHeight).toBe('428px')

    mask.click()
    expect(block.classList.contains('vp-code-fold-active')).toBe(true)
  })

  it('uses expanded padding CSS variable when calculating expanded height', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    block.style.setProperty('--vp-code-fold-expanded-padding-bottom', '40px')
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    mask.click()

    expect(block.style.maxHeight).toBe('440px')
  })

  it('does not fold exactly-at-minHeight code blocks', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(200)
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 200 })

    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
  })

  it('folds code blocks just above minHeight', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(201)
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 200 })

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

    mountCodeBlockFold()

    expect(block1.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(block2.classList.contains('vp-code-fold-processed')).toBe(false)
    expect(block3.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('observes the .vp-doc container for added code blocks', () => {
    const doc = createDocContainer()

    mountCodeBlockFold()

    expect(MockMutationObserver.instances.length).toBe(1)
    expect(MockMutationObserver.instances[0].observe).toHaveBeenCalledWith(
      doc,
      {
        childList: true,
        subtree: true
      }
    )
  })

  it('processes code blocks added by DOM mutation', () => {
    const doc = createDocContainer()

    mountCodeBlockFold()

    const block = createCodeBlock(300)
    doc.appendChild(block)
    MockMutationObserver.instances[0].trigger()

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('reconnects observer and folds code blocks after route change', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    const firstObserver = MockMutationObserver.instances[0]
    document.body.innerHTML = ''
    const newDoc = createDocContainer()
    const newBlock = createCodeBlock(350)
    newDoc.appendChild(newBlock)

    mockRoute.path = '/other-page'
    watchCbs.forEach((cb) => cb())

    expect(firstObserver.disconnect).toHaveBeenCalled()
    expect(MockMutationObserver.instances.length).toBe(2)
    expect(MockMutationObserver.instances[1].observe).toHaveBeenCalledWith(
      newDoc,
      {
        childList: true,
        subtree: true
      }
    )
    expect(newBlock.classList.contains('vp-code-fold-processed')).toBe(true)
  })

  it('only processes blocks within .vp-doc container', () => {
    const doc = createDocContainer()
    const validBlock = createCodeBlock(300)
    doc.appendChild(validBlock)

    const outsideBlock = createCodeBlock(300)
    outsideBlock.classList.add('language-js')
    document.body.appendChild(outsideBlock)

    mountCodeBlockFold()

    expect(validBlock.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(outsideBlock.classList.contains('vp-code-fold-processed')).toBe(
      false
    )
  })

  it('observes processed code blocks for resize changes', () => {
    const doc = createDocContainer()
    const tallBlock = createCodeBlock(300)
    const shortBlock = createCodeBlock(100)
    doc.appendChild(tallBlock)
    doc.appendChild(shortBlock)

    mountCodeBlockFold()

    expect(MockResizeObserver.instances.length).toBe(1)
    expect(MockResizeObserver.instances[0].observe).toHaveBeenCalledWith(
      tallBlock
    )
  })

  it('updates expanded height after debounced resize', () => {
    const doc = createDocContainer()
    const block = createMutableCodeBlock({ height: 300 })
    doc.appendChild(block)

    mountCodeBlockFold()

    const mask = block.querySelector('.vp-code-fold-mask') as HTMLElement
    mask.click()
    expect(block.style.maxHeight).toBe('428px')

    block.setHeights(450, 550)
    MockResizeObserver.instances[0].trigger()
    vi.advanceTimersByTime(199)
    expect(block.style.maxHeight).toBe('428px')

    vi.advanceTimersByTime(1)
    expect(block.style.maxHeight).toBe('578px')
  })

  it('removes fold UI when a resized block is below the threshold', () => {
    const doc = createDocContainer()
    const block = createMutableCodeBlock({ height: 250 })
    doc.appendChild(block)

    mountCodeBlockFold({ minHeight: 200 })

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    block.setHeights(100, 200)
    MockResizeObserver.instances[0].trigger()
    vi.advanceTimersByTime(200)

    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
    expect(block.classList.contains('vp-code-fold-active')).toBe(false)
    expect(block.querySelector('.vp-code-fold-mask')).toBeNull()
    expect(block.style.maxHeight).toBe('')
    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
  })

  it('does not reconnect observer when route changes keep the same doc', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    watchCbs.forEach((cb) => cb())

    expect(MockMutationObserver.instances.length).toBe(1)
    expect(MockMutationObserver.instances[0].observe).toHaveBeenCalledTimes(1)
  })

  it('does not process already registered blocks on repeated mutations', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()
    MockMutationObserver.instances[0].trigger()

    expect(block.querySelectorAll('.vp-code-fold-mask').length).toBe(1)
    expect(MockResizeObserver.instances.length).toBe(1)
  })

  it('cleans up detached blocks during resize re-evaluation', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()
    doc.removeChild(block)
    MockResizeObserver.instances[0].trigger()
    vi.advanceTimersByTime(200)

    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
    expect(block.querySelector('.vp-code-fold-mask')).toBeNull()
    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
  })

  it('allows cleanup before mounted observers are created', () => {
    setupCodeBlockFold()

    expect(() => {
      onUnmountedCbs.forEach((cb) => cb())
    }).not.toThrow()
  })

  it('disconnects observers and route watcher on unmount', () => {
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()
    MockResizeObserver.instances[0].trigger()

    onUnmountedCbs.forEach((cb) => cb())
    vi.runAllTimers()

    expect(MockMutationObserver.instances[0].disconnect).toHaveBeenCalled()
    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
    expect(watchStopCbs[0]).toHaveBeenCalled()
    expect(block.classList.contains('vp-code-fold-processed')).toBe(false)
  })

  it('keeps initial folding when MutationObserver is unavailable', () => {
    globalThis.MutationObserver =
      undefined as unknown as typeof MutationObserver
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(MockMutationObserver.instances.length).toBe(0)
  })

  it('keeps initial folding when ResizeObserver is unavailable', () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver
    const doc = createDocContainer()
    const block = createCodeBlock(300)
    doc.appendChild(block)

    mountCodeBlockFold()

    expect(block.classList.contains('vp-code-fold-processed')).toBe(true)
    expect(MockResizeObserver.instances.length).toBe(0)
  })
})
