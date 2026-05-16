import { type Timeline, createTimeline } from 'animejs'
import { type Ref, nextTick, onUnmounted } from 'vue'

export interface LayoutAnimationOptions {
  /** CSS selector for tracked child elements relative to container */
  childSelector: string
  /** Animation duration in ms (default: 350) */
  duration?: number
  /** anime.js easing (default: 'inOut(3.5)') */
  ease?: string
  /** Initial CSS property values for newly appearing elements */
  enterFrom?: Record<string, number | string>
  /** Target CSS property values for disappearing elements */
  leaveTo?: Record<string, number | string>
  /** Respect prefers-reduced-motion (default: true) */
  respectReducedMotion?: boolean
}

interface SnapshotEntry {
  element: HTMLElement
  rect: DOMRect
}

const NATURAL_STATE: Record<string, string | number> = {
  transform: 'none',
  opacity: 1
}

function isZeroRect(rect: DOMRect): boolean {
  return rect.width === 0 && rect.height === 0
}

export function useLayoutAnimation(
  containerRef: Ref<HTMLElement | undefined>,
  options: LayoutAnimationOptions
) {
  const {
    childSelector,
    duration = 350,
    ease = 'inOut(3.5)',
    enterFrom = { transform: 'translateY(10px)', opacity: 0 },
    leaveTo = { transform: 'translateY(-10px)', opacity: 0 },
    respectReducedMotion = true
  } = options

  let currentTimeline: Timeline | null = null
  let ghostElements: HTMLElement[] = []

  const prefersReducedMotion = (): boolean => {
    if (
      !respectReducedMotion ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  const getChildren = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(childSelector))
  }

  const snapshot = (children: HTMLElement[]): Map<string, SnapshotEntry> => {
    const map = new Map<string, SnapshotEntry>()
    for (const el of children) {
      const key = el.getAttribute('data-flip-key')
      if (key) {
        map.set(key, { element: el, rect: el.getBoundingClientRect() })
      }
    }
    return map
  }

  const cleanup = () => {
    if (currentTimeline) {
      ;(currentTimeline as unknown as { pause: () => void }).pause()
      currentTimeline = null
    }
    for (const ghost of ghostElements) {
      ghost.remove()
    }
    ghostElements = []
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('no-sliding')
    }
  }

  const updateLayout = async (
    stateChange: () => void | Promise<void>
  ): Promise<void> => {
    const container = containerRef.value
    if (!container || typeof document === 'undefined') {
      await stateChange()
      return
    }

    // Cancel any in-flight animation
    cleanup()

    if (prefersReducedMotion()) {
      await stateChange()
      await nextTick()
      return
    }

    // Suppress CSS staggered animations during FLIP
    document.documentElement.classList.add('no-sliding')

    // Capture FIRST state
    const beforeChildren = getChildren(container)
    const beforeSnapshot = snapshot(beforeChildren)

    // Execute state change (updates Vue reactive state)
    await stateChange()

    // Wait for Vue DOM flush + layout paint
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    // Capture LAST state
    const afterChildren = getChildren(container)
    const afterSnapshot = snapshot(afterChildren)

    // Classify elements
    const entering: SnapshotEntry[] = []
    const leaving: SnapshotEntry[] = []
    const moving: {
      key: string
      element: HTMLElement
      from: DOMRect
      to: DOMRect
    }[] = []

    for (const [key, snap] of afterSnapshot) {
      const before = beforeSnapshot.get(key)
      if (!before || isZeroRect(before.rect)) {
        // New element or previously hidden (v-show)
        if (!isZeroRect(snap.rect)) {
          entering.push(snap)
        }
      } else if (!isZeroRect(before.rect) && !isZeroRect(snap.rect)) {
        const from = before.rect
        const to = snap.rect
        if (
          Math.abs(from.top - to.top) > 0.5 ||
          Math.abs(from.left - to.left) > 0.5 ||
          Math.abs(from.width - to.width) > 0.5 ||
          Math.abs(from.height - to.height) > 0.5
        ) {
          moving.push({ key, element: snap.element, from, to })
        }
      }
    }

    for (const [key, snap] of beforeSnapshot) {
      const after = afterSnapshot.get(key)
      if (!after || isZeroRect(after.rect)) {
        // Removed or now hidden (v-show)
        if (!isZeroRect(snap.rect)) {
          leaving.push(snap)
        }
      }
    }

    // Create ghost elements for leaving items
    for (const snap of leaving) {
      const ghost = document.createElement('div')
      const computed = getComputedStyle(snap.element)
      ghost.style.position = 'fixed'
      ghost.style.left = snap.rect.left + 'px'
      ghost.style.top = snap.rect.top + 'px'
      ghost.style.width = snap.rect.width + 'px'
      ghost.style.height = snap.rect.height + 'px'
      ghost.style.opacity = '1'
      ghost.style.pointerEvents = 'none'
      ghost.style.zIndex = '1000'
      ghost.style.backgroundColor = computed.backgroundColor
      ghost.style.borderRadius = computed.borderRadius
      ghost.style.boxShadow = computed.boxShadow
      ghost.style.overflow = 'hidden'
      document.body.appendChild(ghost)
      ghostElements.push(ghost)
    }

    // Build animation timeline
    const timelineAdditions: Array<Record<string, unknown>> = []

    // Leaving ghosts — animate out, then remove
    for (const ghost of ghostElements) {
      timelineAdditions.push({
        targets: ghost,
        ...leaveTo,
        duration: duration * 0.4,
        ease: 'out(2)',
        complete: () => {
          ghost.remove()
          ghostElements = ghostElements.filter((g) => g !== ghost)
        }
      })
    }

    // Moving elements — invert transform, then animate to identity
    for (const item of moving) {
      const dx = item.from.left - item.to.left
      const dy = item.from.top - item.to.top
      const sx =
        item.from.width > 0 && item.to.width > 0
          ? item.from.width / item.to.width
          : 1
      const sy =
        item.from.height > 0 && item.to.height > 0
          ? item.from.height / item.to.height
          : 1

      item.element.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
      item.element.style.transition = 'none'
      // Force layout so the inverted transform is painted before animation
      void item.element.offsetHeight

      timelineAdditions.push({
        targets: item.element,
        transform: 'translate(0, 0) scale(1, 1)',
        duration,
        ease
      })
    }

    // Entering elements — set enterFrom as initial state, animate to natural
    for (const snap of entering) {
      for (const [prop, value] of Object.entries(enterFrom)) {
        ;(snap.element.style as unknown as Record<string, string>)[prop] =
          String(value)
      }
      snap.element.style.transition = 'none'
      void snap.element.offsetHeight

      const toState: Record<string, unknown> = {}
      for (const prop of Object.keys(enterFrom)) {
        toState[prop] = NATURAL_STATE[prop] ?? null
      }

      timelineAdditions.push({
        targets: snap.element,
        ...toState,
        duration,
        ease
      })
    }

    if (timelineAdditions.length > 0) {
      const timeline = createTimeline(
        timelineAdditions as unknown as Parameters<typeof createTimeline>[0]
      )
      currentTimeline = timeline

      timeline.onComplete = () => {
        currentTimeline = null
        document.documentElement.classList.remove('no-sliding')
      }
      await timeline.then(() => {})
    } else {
      document.documentElement.classList.remove('no-sliding')
    }
  }

  onUnmounted(cleanup)

  return { updateLayout, cleanup }
}
