import { useData, useRoute, withBase } from 'vitepress'
import { computed, nextTick, provide } from 'vue'

export function useDocMetaInsertSelector() {
  const { frontmatter } = useData()
  return computed(() => frontmatter.value?.docMetaInsertSelector || 'h1')
}

export function useDocMetaInsertPosition() {
  const { frontmatter } = useData()
  return computed(() => frontmatter.value?.docMetaInsertPosition || 'after')
}

/**
 * @overview: use description for page cards, if the length of words
 * is more than 40 words, show the first 40 words followed by an ellipsis.
 * if the description is Chinese, the length of words is more than 20 words.
 */
export function useCardDescription(description: string) {
  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

  return computed(() => {
    // for Chinese: if the length of words is more than 42 words, show the first 42 words followed by an ellipsis.
    if (isChinese(description)) {
      if (description.length > 42) {
        return description.slice(0, 42) + '...'
      }
    } else {
      // for English: if the length of words is more than 30 words, show the first 30 words followed by an ellipsis.
      const words = description.split(' ')
      if (words.length > 30) {
        return words.slice(0, 30).join(' ') + '...'
      }
    }
    return description
  })
}

export function useDarkTransition() {
  const { isDark } = useData()
  const enableTransitions = () =>
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches

  provide(
    'toggle-appearance',
    async ({ clientX: x, clientY: y }: MouseEvent) => {
      if (!enableTransitions()) {
        isDark.value = !isDark.value
        return
      }
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        )}px at ${x}px ${y}px)`
      ]
      await document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      }).ready
      document.documentElement.animate(
        { clipPath: isDark.value ? clipPath.reverse() : clipPath },
        {
          duration: 300,
          easing: 'ease-in',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
        }
      )
    }
  )
}
