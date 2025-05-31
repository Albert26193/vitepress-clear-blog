import { useData } from 'vitepress'
import { type ComputedRef, computed, nextTick, provide } from 'vue'

import { type PostFrontMatter } from '../types/types.d'

/**
 * Truncates description text based on content type and display context
 *
 * @param description Text to be truncated
 * @param options Configuration options
 * @param options.maxChineseChars Maximum number of Chinese characters before truncation
 * @param options.maxEnglishWords Maximum number of English words before truncation
 * @param options.applyFilters Whether to apply content filters (currently not implemented)
 * @returns Computed ref with the truncated description
 */
const useTruncatedDescription = (
  description: string,
  options: {
    maxChineseChars?: number
    maxEnglishWords?: number
    applyFilters?: boolean
  } = {}
): ComputedRef<string> => {
  if (!description) {
    return computed(() => '')
  }

  const {
    maxChineseChars = 42, // Default from previous useCardDescription
    maxEnglishWords = 30, // Default from previous useCardDescription
    applyFilters = false
  } = options

  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

  // TODO: Apply these filters when applyFilters is true
  // - filter yaml frontmatter
  // - filter code blocks
  // - filter inline code
  // - filter html tags
  // - filter markdown title and multiple heads
  // - filter multiple spaces and new lines
  // - filter cite
  const processedContent = description

  if (applyFilters) {
    // Currently not implemented, would contain the filtering logic
    // that was commented out in previous useListDescription
  }

  return computed(() => {
    if (isChinese(processedContent)) {
      if (processedContent.length > maxChineseChars) {
        return processedContent.slice(0, maxChineseChars) + '...'
      }
    } else {
      const words = processedContent.split(' ')
      if (words.length > maxEnglishWords) {
        return words.slice(0, maxEnglishWords).join(' ') + '...'
      }
    }
    return processedContent
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

/**
 * Process HTML content and return a preview
 * This will:
 * 1. Extract meaningful content from HTML (not just the first paragraph)
 * 2. Skip block quotes, citation blocks and other non-content elements when possible
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

/**
 * @abstract: use title for page cards,
 * candidate titles:
 * 1. title from frontmatter
 * 2. first heading of the page
 *
 * @param frontMatter
 * @returns title
 */
const useTitle = (frontMatter: PostFrontMatter, html: string) => {
  // 1. first use title from frontmatter
  if (frontMatter.title) {
    return frontMatter.title
  }
  // 2. otherwise use first heading of the page
  const div = document.createElement('div')
  div.innerHTML = html
  const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    return headings[0].textContent || ''
  }
  return ''
}

export {
  useTruncatedDescription,
  useAuthor,
  useDarkTransition,
  useHtmlPreview,
  useTitle
}
