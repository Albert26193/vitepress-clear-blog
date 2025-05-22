import { useData } from 'vitepress'
import { type ComputedRef, computed, nextTick, provide } from 'vue'

import { type PostFrontMatter } from '../types/types.d'

/**
 * @abstract: use description for page cards, if the length of words
 * is more than 30 words, show the first 30 words followed by an ellipsis.
 * if the description is Chinese, the length of words is more than 42 words.
 *
 * @param description: string
 * @return truncated description
 */
const useCardDescription = (description: string) => {
  if (!description) {
    return ''
  }
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
  if (!description) {
    return ''
  }
  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

  // TODO: more situations
  // 1. filter yaml frontmatter
  // 2. filter code blocks
  // 3. filter inline code
  // 4. filter html tags
  // 5. filter markdown title and multiple heads
  // 6. filter multiple spaces and new lines
  // 7. filter cite
  const filteredContent = description
  // .replace(/^---[\s\S]*?---/, '') // Remove YAML frontmatter
  // .replace(/```[\s\S]*?```/g, '') // Remove code blocks
  // .replace(/`[\s\S]*?`/g, '') // Remove inline code
  // .replace(/<[^>]*>/g, '') // Remove HTML tags
  // .replace(/#{1,6}\s+[^\n]+/g, '') // Remove markdown headings
  // .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
  // .replace(/^>[\s\S]*?$/gm, '') // Remove cite
  // .trim() // Trim whitespace

  // return computed(() => {
  //   // for Chinese: if the length of words is more than 42 words, show the first 42 words followed by an ellipsis.
  //   if (isChinese(filteredContent)) {
  //     if (filteredContent.length > 90) {
  //       return filteredContent.slice(0, 90) + '...'
  //     }
  //   } else {
  //     // for English: if the length of words is more than 30 words, show the first 30 words followed by an ellipsis.
  //     const words = filteredContent.split(' ')
  //     if (words.length > 50) {
  //       return words.slice(0, 50).join(' ') + '...'
  //     }
  //   }
  //   return filteredContent
  // })
  return filteredContent
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

/**
 * Process HTML content and return a preview
 * This will:
 * 1. Extract meaningful content from HTML (not just the first paragraph)
 * 2. Skip blockquotes, citation blocks and other non-content elements when possible
 * 3. Truncate content while keeping HTML structure intact
 * 4. Handle both Chinese and English content differently
 *
 * @param html The HTML content to process
 * @param options Configuration options
 * @returns A computed ref containing the processed HTML preview
 */
const useHtmlPreview = (
  html: string,
  options: {
    maxChineseLength?: number
    maxEnglishWords?: number
  } = {}
): ComputedRef<string> => {
  const { maxChineseLength = 120, maxEnglishWords = 60 } = options

  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

  return computed(() => {
    if (!html) return ''

    try {
      // Create a temporary div to parse HTML
      const div = document.createElement('div')
      div.innerHTML = html

      // 1. Try to find the main content paragraph
      // Priority: regular paragraphs > lists > other content
      const paragraphs = Array.from(div.getElementsByTagName('p'))
      let mainContent = ''
      let contentElement = null

      // Skip very short paragraphs and blockquotes
      const meaningfulParagraphs = paragraphs.filter((p) => {
        // Skip blockquotes, citations, etc.
        if (
          p.closest('blockquote') ||
          p.parentElement?.tagName.toLowerCase() === 'blockquote'
        ) {
          return false
        }

        // Skip very short paragraphs (likely headings or incomplete sentences)
        const text = p.textContent || ''
        return text.length > 20
      })

      if (meaningfulParagraphs.length > 0) {
        contentElement = meaningfulParagraphs[0]
        mainContent = contentElement.innerHTML
      } else {
        // If no good paragraphs, try lists or other content
        const lists = Array.from(div.getElementsByTagName('ul')).concat(
          Array.from(div.getElementsByTagName('ol'))
        )

        if (lists.length > 0) {
          contentElement = lists[0]
          mainContent = contentElement.innerHTML
        } else {
          // Fallback to div's content, excluding headings
          const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6')
          headings.forEach((h) => h.remove())

          mainContent = div.innerHTML
        }
      }

      // Get text content for length checking
      const textContent = contentElement?.textContent || div.textContent || ''

      // Apply length limits while preserving HTML structure
      if (isChinese(textContent)) {
        if (textContent.length > maxChineseLength) {
          // For Chinese content, we need to be careful with HTML tags
          let currentLength = 0
          let result = ''
          let inTag = false

          for (let i = 0; i < mainContent.length; i++) {
            const char = mainContent[i]

            if (char === '<') inTag = true
            if (!inTag) currentLength++
            if (char === '>') inTag = false

            result += char

            if (currentLength >= maxChineseLength && !inTag) {
              result += '...'
              break
            }
          }
          mainContent = result
        }
      } else {
        // For English content, split by words
        const words = textContent.split(/\s+/)
        if (words.length > maxEnglishWords) {
          // Similar process for English, but word-based
          let wordCount = 0
          let result = ''
          let inTag = false

          for (let i = 0; i < mainContent.length; i++) {
            const char = mainContent[i]

            if (char === '<') inTag = true
            if (!inTag && char === ' ') wordCount++
            if (char === '>') inTag = false

            result += char

            if (wordCount >= maxEnglishWords && !inTag && char === ' ') {
              result += '...'
              break
            }
          }
          mainContent = result
        }
      }

      // Clean up any footnotes
      mainContent = mainContent.replace(/\[\^(\d+)\]/g, '')

      return mainContent
    } catch (e) {
      console.error('Error processing HTML preview:', e)
      return html.substring(0, 200) + '...' // Fallback if DOM parsing fails
    }
  })
}

export {
  useCardDescription,
  useListDescription,
  useAuthor,
  useDarkTransition,
  useHtmlPreview
}
