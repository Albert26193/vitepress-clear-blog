/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useLayoutAnimation } from '../../src/composables/useLayoutAnimation'

// Mock animejs
vi.mock('animejs', () => {
  let timelineId = 0
  const mockTimeline = {
    pause: vi.fn(),
    onComplete: null as (() => void) | null,
    then: vi.fn((cb: () => void) => {
      // Resolve after a microtask to simulate async completion
      return Promise.resolve().then(() => {
        mockTimeline.onComplete?.()
        cb?.()
      })
    })
  }
  return {
    createTimeline: vi.fn(() => {
      timelineId++
      return { ...mockTimeline, id: timelineId }
    })
  }
})

describe('useLayoutAnimation', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.classList.remove('no-sliding')
  })

  describe('API shape', () => {
    it('returns updateLayout and cleanup functions', () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const result = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })
      expect(typeof result.updateLayout).toBe('function')
      expect(typeof result.cleanup).toBe('function')
    })
  })

  describe('updateLayout', () => {
    it('calls stateChange callback', async () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      const stateChange = vi.fn()
      await updateLayout(stateChange)

      expect(stateChange).toHaveBeenCalledTimes(1)
    })

    it('returns a Promise', () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      const result = updateLayout(() => {})
      expect(result).toBeInstanceOf(Promise)
    })

    it('supports async stateChange callbacks', async () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      let changed = false
      await updateLayout(async () => {
        await new Promise((r) => setTimeout(r, 10))
        changed = true
      })

      expect(changed).toBe(true)
    })
  })

  describe('reduced motion', () => {
    it('skips animation when prefers-reduced-motion is set', async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes('reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      })) as unknown as typeof window.matchMedia

      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      const { createTimeline } = await import('animejs')
      const stateChange = vi.fn()
      await updateLayout(stateChange)

      expect(stateChange).toHaveBeenCalled()
      expect(createTimeline).not.toHaveBeenCalled()

      window.matchMedia = originalMatchMedia
    })

    it('allows overriding respectReducedMotion', async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes('reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      })) as unknown as typeof window.matchMedia

      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child',
        respectReducedMotion: false
      })

      const stateChange = vi.fn()
      await updateLayout(stateChange)

      // Should still animate since we disabled reduced motion check
      expect(stateChange).toHaveBeenCalled()

      window.matchMedia = originalMatchMedia
    })
  })

  describe('no-sliding class', () => {
    it('adds no-sliding class during animation', async () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      expect(document.documentElement.classList.contains('no-sliding')).toBe(
        false
      )

      const promise = updateLayout(() => {})
      // Class should be added synchronously
      expect(document.documentElement.classList.contains('no-sliding')).toBe(
        true
      )

      await promise
      // Class should be removed after animation completes
      expect(document.documentElement.classList.contains('no-sliding')).toBe(
        false
      )
    })
  })

  describe('SSR guard', () => {
    it('handles undefined containerRef gracefully', async () => {
      const containerRef = ref<HTMLElement | undefined>(undefined)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      const stateChange = vi.fn()
      await expect(updateLayout(stateChange)).resolves.toBeUndefined()
      expect(stateChange).toHaveBeenCalled()
    })
  })

  describe('element tracking', () => {
    it('snapshots children with data-flip-key attributes', () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.item'
      })

      const child = document.createElement('div')
      child.className = 'item'
      child.setAttribute('data-flip-key', 'post-1')
      container.appendChild(child)

      // Just verify the setup works and doesn't throw
      expect(() =>
        updateLayout(() => {
          child.remove()
        })
      ).not.toThrow()
    })

    it('ignores children without data-flip-key', () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { updateLayout } = useLayoutAnimation(containerRef, {
        childSelector: '.item'
      })

      const child = document.createElement('div')
      child.className = 'item'
      // No data-flip-key attribute
      container.appendChild(child)

      expect(() =>
        updateLayout(() => {
          child.remove()
        })
      ).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('cancels ongoing animation', async () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const { cleanup } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      expect(() => cleanup()).not.toThrow()
    })

    it('removes no-sliding class on cleanup', () => {
      document.documentElement.classList.add('no-sliding')
      const containerRef = ref<HTMLElement | undefined>(container)
      const { cleanup } = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      cleanup()
      expect(document.documentElement.classList.contains('no-sliding')).toBe(
        false
      )
    })
  })

  describe('default options', () => {
    it('uses sensible defaults when options are minimal', () => {
      const containerRef = ref<HTMLElement | undefined>(container)
      const result = useLayoutAnimation(containerRef, {
        childSelector: '.child'
      })

      expect(result).toBeDefined()
      expect(result.updateLayout).toBeDefined()
      expect(result.cleanup).toBeDefined()
    })
  })
})
