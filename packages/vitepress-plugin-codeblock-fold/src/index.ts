import { useRoute } from 'vitepress'
import { nextTick, onMounted, watch } from 'vue'

import './style.css'

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

/**
 * Installs client-side folding so long VitePress code blocks do not dominate article layouts.
 *
 * @param options - Thresholds that control when and how much code remains visible.
 * @returns Nothing; the behavior is registered against the active Vue route.
 */
export function setupCodeBlockFold(options: CodeBlockFoldOptions = {}) {
  // Ensure running in browser environment
  if (typeof window === 'undefined') return

  const route = useRoute()
  const minHeight = options.minHeight ?? 200
  const visibleHeight = options.visibleHeight ?? minHeight

  const foldCodeBlocks = () => {
    const codeBlocks = document.querySelectorAll(
      '.vp-doc div[class*="language-"]'
    )

    codeBlocks.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (htmlEl.classList.contains('vp-code-fold-processed')) return

      // Get actual height
      const height = htmlEl.clientHeight

      if (height > minHeight) {
        htmlEl.classList.add('vp-code-fold-processed')

        // Create mask and button
        const mask = document.createElement('div')
        mask.className = 'vp-code-fold-mask'
        mask.setAttribute('role', 'button')
        mask.setAttribute('tabindex', '0')

        // Initial state: folded
        let isFolded = true

        const updateState = () => {
          if (isFolded) {
            htmlEl.style.maxHeight = `${visibleHeight}px`
            htmlEl.classList.add('vp-code-fold-active')
            mask.setAttribute('aria-expanded', 'false')
            mask.setAttribute('aria-label', 'Expand code block')
            mask.innerHTML = `<span class="vp-code-fold-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>`
          } else {
            // When expanded, set to scrollHeight + padding
            // Note: padding-bottom is set to 28px in CSS
            htmlEl.style.maxHeight = `${htmlEl.scrollHeight + 30}px`
            htmlEl.classList.remove('vp-code-fold-active')
            mask.setAttribute('aria-expanded', 'true')
            mask.setAttribute('aria-label', 'Collapse code block')
            mask.innerHTML = `<span class="vp-code-fold-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </span>`
          }
        }

        mask.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            isFolded = !isFolded
            updateState()
          }
        }

        mask.onclick = (e) => {
          e.stopPropagation()
          isFolded = !isFolded
          updateState()
        }

        // Apply initial state
        updateState()
        htmlEl.appendChild(mask)
      }
    })
  }

  onMounted(() => {
    foldCodeBlocks()
    // Watch route changes
    watch(
      () => route.path,
      () => {
        nextTick(() => {
          // Delay to ensure DOM update
          setTimeout(foldCodeBlocks, 500)
        })
      }
    )
  })
}

export default setupCodeBlockFold
