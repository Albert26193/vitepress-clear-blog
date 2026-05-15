import { useRoute } from 'vitepress'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { WatchStopHandle } from 'vue'

export interface CodeBlockFoldOptions {
  /**
   * Defines when a code block becomes visually collapsible.
   *
   * @default 200
   */
  minHeight?: number
  /**
   * Keeps a folded block tall enough to hint that more code is available.
   *
   * @default 50
   */
  visibleHeight?: number
}

interface CodeBlockState {
  isFolded: boolean
  mask: HTMLElement
  resizeObserver?: ResizeObserver
  resizeTimer?: number
}

const CODE_BLOCK_SELECTOR = '.vp-doc div[class*="language-"]'
const DOC_SELECTOR = '.vp-doc'
const PROCESSED_CLASS = 'vp-code-fold-processed'
const ACTIVE_CLASS = 'vp-code-fold-active'
const RESIZE_DEBOUNCE_MS = 200
const EXPANDED_PADDING_VAR = '--vp-code-fold-expanded-padding-bottom'
const DEFAULT_EXPANDED_PADDING = 28

const DOWN_ICON = `<span class="vp-code-fold-btn">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
</span>`

const UP_ICON = `<span class="vp-code-fold-btn">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
</span>`

const getExpandedPadding = (htmlEl: HTMLElement): number => {
  const rawValue = window
    .getComputedStyle(htmlEl)
    .getPropertyValue(EXPANDED_PADDING_VAR)
  const parsedValue = Number.parseFloat(rawValue)

  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_EXPANDED_PADDING
}

/**
 * Installs client-side folding so long VitePress code blocks do not dominate article layouts.
 *
 * @param options - Thresholds that control when and how much code remains visible.
 * @returns Nothing; the behavior is registered against the active Vue route.
 */
export function setupCodeBlockFold(options: CodeBlockFoldOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const route = useRoute()
  const minHeight = options.minHeight ?? 200
  const visibleHeight = options.visibleHeight ?? 50
  const codeBlockStates = new Map<HTMLElement, CodeBlockState>()

  let mutationObserver: MutationObserver | undefined
  let observedDoc: Element | null = null
  let processQueued = false
  let stopRouteWatch: WatchStopHandle | undefined

  if (visibleHeight >= minHeight) {
    return
  }

  const updateCodeBlockState = (htmlEl: HTMLElement, state: CodeBlockState) => {
    if (state.isFolded) {
      htmlEl.style.maxHeight = `${visibleHeight}px`
      htmlEl.classList.add(ACTIVE_CLASS)
      state.mask.setAttribute('aria-expanded', 'false')
      state.mask.setAttribute('aria-label', 'Expand code block')
      state.mask.innerHTML = DOWN_ICON
      return
    }

    htmlEl.style.maxHeight = `${htmlEl.scrollHeight + getExpandedPadding(htmlEl)}px`
    htmlEl.classList.remove(ACTIVE_CLASS)
    state.mask.setAttribute('aria-expanded', 'true')
    state.mask.setAttribute('aria-label', 'Collapse code block')
    state.mask.innerHTML = UP_ICON
  }

  const cleanupCodeBlock = (htmlEl: HTMLElement) => {
    const state = codeBlockStates.get(htmlEl)
    if (!state) return

    window.clearTimeout(state.resizeTimer)
    state.resizeObserver?.disconnect()
    state.mask.remove()
    htmlEl.classList.remove(PROCESSED_CLASS, ACTIVE_CLASS)
    htmlEl.style.maxHeight = ''
    codeBlockStates.delete(htmlEl)
  }

  const cleanupDetachedCodeBlocks = () => {
    codeBlockStates.forEach((_state, htmlEl) => {
      if (!document.contains(htmlEl)) {
        cleanupCodeBlock(htmlEl)
      }
    })
  }

  const reEvaluateCodeBlock = (htmlEl: HTMLElement) => {
    const state = codeBlockStates.get(htmlEl)
    if (!state) return

    if (!document.contains(htmlEl)) {
      cleanupCodeBlock(htmlEl)
      return
    }

    const height = Math.max(htmlEl.clientHeight, htmlEl.scrollHeight)
    if (height <= minHeight) {
      cleanupCodeBlock(htmlEl)
      return
    }

    updateCodeBlockState(htmlEl, state)
  }

  const observeCodeBlockResize = (
    htmlEl: HTMLElement,
    state: CodeBlockState
  ) => {
    if (typeof ResizeObserver === 'undefined') return

    state.resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(state.resizeTimer)
      state.resizeTimer = window.setTimeout(() => {
        state.resizeTimer = undefined
        reEvaluateCodeBlock(htmlEl)
      }, RESIZE_DEBOUNCE_MS)
    })
    state.resizeObserver.observe(htmlEl)
  }

  const processCodeBlock = (htmlEl: HTMLElement) => {
    if (
      codeBlockStates.has(htmlEl) ||
      htmlEl.classList.contains(PROCESSED_CLASS)
    ) {
      return
    }

    if (htmlEl.clientHeight <= minHeight) return

    const mask = document.createElement('div')
    const state: CodeBlockState = {
      isFolded: true,
      mask
    }

    htmlEl.classList.add(PROCESSED_CLASS)
    mask.className = 'vp-code-fold-mask'
    mask.setAttribute('role', 'button')
    mask.setAttribute('tabindex', '0')

    mask.onkeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return

      event.preventDefault()
      event.stopPropagation()
      state.isFolded = !state.isFolded
      updateCodeBlockState(htmlEl, state)
    }

    mask.onclick = (event) => {
      event.stopPropagation()
      state.isFolded = !state.isFolded
      updateCodeBlockState(htmlEl, state)
    }

    codeBlockStates.set(htmlEl, state)
    updateCodeBlockState(htmlEl, state)
    htmlEl.appendChild(mask)
    observeCodeBlockResize(htmlEl, state)
  }

  const processCodeBlocks = () => {
    cleanupDetachedCodeBlocks()
    document.querySelectorAll(CODE_BLOCK_SELECTOR).forEach((el) => {
      processCodeBlock(el as HTMLElement)
    })
  }

  const observeDoc = () => {
    const doc = document.querySelector(DOC_SELECTOR)
    if (doc === observedDoc) return

    mutationObserver?.disconnect()
    mutationObserver = undefined
    observedDoc = doc

    if (!doc || typeof MutationObserver === 'undefined') return

    mutationObserver = new MutationObserver(() => {
      processAfterNextTick()
    })
    mutationObserver.observe(doc, {
      childList: true,
      subtree: true
    })
  }

  const processAfterNextTick = () => {
    if (processQueued) return

    processQueued = true
    void nextTick(() => {
      processQueued = false
      observeDoc()
      processCodeBlocks()
    })
  }

  const cleanupAll = () => {
    mutationObserver?.disconnect()
    mutationObserver = undefined
    observedDoc = null
    processQueued = false
    stopRouteWatch?.()
    stopRouteWatch = undefined
    Array.from(codeBlockStates.keys()).forEach(cleanupCodeBlock)
  }

  onMounted(() => {
    processAfterNextTick()
    stopRouteWatch = watch(
      () => route.path,
      () => {
        processAfterNextTick()
      }
    )
  })

  onUnmounted(() => {
    cleanupAll()
  })
}

export default setupCodeBlockFold
