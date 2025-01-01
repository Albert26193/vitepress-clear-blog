import { useData } from 'vitepress'
import { computed, nextTick, provide } from 'vue'

import { type PostFrontMatter } from '../types.d'

/**
 * @abstract: use description for page cards, if the length of words
 * is more than 30 words, show the first 30 words followed by an ellipsis.
 * if the description is Chinese, the length of words is more than 42 words.
 *
 * @param description: string
 * @return truncated description
 */
const useCardDescription = (description: string) => {
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

/**
 * @abstract: use description for page list, if the length of words
 * is more than 50 words, show the first 50 words followed by an ellipsis.
 * if the description is Chinese, the length of words is more than 90 words.
 *
 * @param description: string
 * @returns truncated description
 */
const useListDescription = (description: string) => {
  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)
  return computed(() => {
    // for Chinese: if the length of words is more than 42 words, show the first 42 words followed by an ellipsis.
    if (isChinese(description)) {
      if (description.length > 90) {
        return description.slice(0, 90) + '...'
      }
    } else {
      // for English: if the length of words is more than 30 words, show the first 30 words followed by an ellipsis.
      const words = description.split(' ')
      if (words.length > 50) {
        return words.slice(0, 50).join(' ') + '...'
      }
    }
    return description
  })
}

/**
 * @abstract: use author for article,
 * if author is set in frontmatter,use author from frontmatter,
 * if author is not set in frontmatter, use author from config,
 * if author is not set in config, use default author
 *
 * @param frontMatter
 * @returns author name
 */
const useAuthor = (frontMatter: PostFrontMatter) => {
  const { site } = useData()
  // 1. first use author from frontmatter
  if (frontMatter.author) {
    return frontMatter.author
  }
  // 2. otherwise use default author from config
  if (site.value.themeConfig?.meta?.author) {
    return site.value.themeConfig.meta.author
  }
  // 3. otherwise use default author from vitepress
  return 'Blogger'
}

/**
 * @abstract: use transition for dark mode
 */
const useDarkTransition = () => {
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

export { useCardDescription, useListDescription, useAuthor, useDarkTransition }
