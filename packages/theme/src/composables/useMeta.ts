// Import dayjs from its ESM build. This composable ships as source in the
// published theme, so it is transformed by the consumer's Vite pipeline from
// node_modules — where Vite does not rewrite bare CJS imports to optimized
// deps. The default `dayjs` / `dayjs/plugin/*` entrypoints are UMD/CJS and have
// no ESM default export, which breaks `pnpm dev` in scaffolded blogs with
// "does not provide an export named 'default'". The `dayjs/esm` paths are real
// ESM modules and resolve cleanly without dep pre-bundling.
import dayjs from 'dayjs/esm'
import customParseFormat from 'dayjs/esm/plugin/customParseFormat'
import { useData } from 'vitepress'
import { type ComputedRef, computed, nextTick, provide } from 'vue'

import { type PostFrontMatter } from '../types/types.d'

dayjs.extend(customParseFormat)

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
 * Resolves the display author with frontmatter taking precedence over site defaults.
 *
 * @param frontMatter - Post frontmatter that may override the configured author.
 * @returns Author name suitable for post metadata UI.
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
 * Provides the appearance toggle hook used by VitePress while honoring reduced-motion preferences.
 *
 * @returns Nothing; the toggle function is provided to descendant components.
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
 * Extract a plain-text preview from rendered post HTML.
 *
 * Picks the first meaningful paragraph (skipping blockquotes and very short
 * paragraphs), falls back to lists or the whole body minus headings, then
 * truncates to the requested length. Both SSR and CSR paths produce the same
 * plain-text output so there is no hydration mismatch.
 *
 * @param html Rendered post HTML from VitePress content loader
 * @param options Configuration options
 * @returns A computed ref containing the plain-text preview
 */
const useHtmlPreview = (
  html = '',
  options: {
    maxChineseLength?: number
    maxEnglishWords?: number
  } = {}
): ComputedRef<string> => {
  const { maxChineseLength = 120, maxEnglishWords = 60 } = options

  const isChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str)

  const stripTags = (s: string) =>
    s
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

  const truncate = (text: string): string => {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized) return ''

    if (isChinese(normalized)) {
      if (normalized.length > maxChineseLength) {
        return normalized.slice(0, maxChineseLength) + '...'
      }
    } else {
      const words = normalized.split(' ')
      if (words.length > maxEnglishWords) {
        return words.slice(0, maxEnglishWords).join(' ') + '...'
      }
    }
    return normalized
  }

  return computed(() => {
    if (!html) return ''

    try {
      // SSR path: strip tags with regex, then truncate
      if (typeof document === 'undefined') {
        return truncate(stripTags(html))
      }

      // CSR path: use DOM for accurate text extraction
      const div = document.createElement('div')
      div.innerHTML = html

      // Remove tag/meta elements that should not contribute to the excerpt
      div
        .querySelectorAll(
          '.blog-tag, .blog-tags, .tags, .clear-blog-tags, .vp-tag'
        )
        .forEach((el) => el.remove())

      // Remove footnote markers (sup > a.footnote-ref)
      div
        .querySelectorAll('sup.footnote-ref, a.footnote-ref')
        .forEach((el) => el.remove())

      // Find the first meaningful paragraph outside blockquotes
      const paragraphs = Array.from(div.getElementsByTagName('p'))
      const meaningful = paragraphs.find((p) => {
        if (
          p.closest('blockquote') ||
          p.parentElement?.tagName.toLowerCase() === 'blockquote'
        ) {
          return false
        }
        return (p.textContent || '').length > 20
      })

      if (meaningful) {
        return truncate(meaningful.textContent || '')
      }

      // Fallback: first list
      const list = div.querySelector('ul') || div.querySelector('ol')
      if (list) {
        return truncate(list.textContent || '')
      }

      // Last resort: body minus headings
      div.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => h.remove())
      return truncate(div.textContent || '')
    } catch {
      return truncate(stripTags(html))
    }
  })
}

/**
 * Chooses the best title for post cards when frontmatter is incomplete.
 *
 * @param frontMatter - Post frontmatter that may provide an explicit title.
 * @param html - Rendered post HTML used to find a heading fallback.
 * @returns Display title for post cards and lists.
 */
const useTitle = (frontMatter: PostFrontMatter, html = '') => {
  if (frontMatter.title) {
    return frontMatter.title
  }
  if (typeof document === 'undefined' || !html) {
    return ''
  }
  const div = document.createElement('div')
  div.innerHTML = html
  const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    return headings[0].textContent || ''
  }
  return ''
}

/**
 * Validates dates before formatting so list UI does not display misleading fallback dates.
 *
 * @param date - Candidate date string from post frontmatter.
 * @returns Whether the date can be formatted by the theme.
 */
const _checkTimeFormat = (date: string) => {
  if (!date) {
    return false
  }
  if (date.length != 10) {
    return false
  }
  if (date.split('-').length != 3) {
    return false
  }
  if (dayjs(date, 'YYYY-MM-DD', true).isValid()) {
    return true
  }
  return false
}

/**
 * Formats valid frontmatter dates for compact post metadata display.
 *
 * @param date - Post date in the theme-supported format.
 * @returns Display date, or an empty string when the input should not be shown.
 */
const useTimeFormat = (date: string) => {
  if (!date || !_checkTimeFormat(date)) {
    return ''
  }
  const { theme } = useData()
  const format = (theme.value as Record<string, unknown>).dateFormat as
    | string
    | undefined
  return dayjs(date).format(format || 'MMM D, YYYY')
}

export {
  useTruncatedDescription,
  useAuthor,
  useDarkTransition,
  useHtmlPreview,
  useTitle,
  useTimeFormat
}
