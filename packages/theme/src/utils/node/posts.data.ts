import { createContentLoader } from 'vitepress'

import type { Post, PostFrontMatter } from '../../types/types.d'
import { normalizePostDate } from './datetime'

declare const data: Post[]
export { data }

/**
 * Decide whether a markdown file should appear in post listings.
 *
 * Posts are matched site-wide (`**\/*.md`) so the theme works regardless of
 * whether content lives under `docs/blogs/` or at the docs root. A file is a
 * post unless it is a functional/route page:
 *
 * - `article: false` — canonical opt-out for any non-post page.
 * - `page: true` / `layout: home` — defensive fallbacks for built-in route
 *   pages (Tags, Timeline, Pages, Homepage) that already carry these flags.
 * - reserved route prefixes (`/pages`, `/timeline`, `/tags`, `/collections`)
 *   — built-in theme routes whose content is not part of the post feed. This
 *   mirrors the reserved-route set in NewLayout.vue.
 */
const RESERVED_ROUTE_RE = /^\/(pages|timeline|tags|collections)(\/|$)/

const isPost = (frontmatter: Record<string, unknown>, url: string): boolean => {
  if (frontmatter.article === false) return false
  if (frontmatter.page === true) return false
  if (frontmatter.layout === 'home') return false
  if (RESERVED_ROUTE_RE.test(url.replace(/\.html$/, ''))) return false
  return true
}

export default createContentLoader<Post[]>('**/*.md', {
  includeSrc: true,
  render: true,
  transform(rawData) {
    return rawData
      .filter((page) => isPost(page.frontmatter, page.url))
      .map((page) => {
        const normalized = normalizePostDate(
          page.frontmatter as Record<string, unknown>
        )
        if (normalized) {
          page.frontmatter.date = normalized
        } else if (page.frontmatter.date) {
          // Safety net: fall back to legacy behavior when the datetime
          // pipeline cannot normalize the value (e.g. timestamp numbers).
          const date = new Date(page.frontmatter.date as string | number | Date)
          if (!isNaN(date.getTime())) {
            page.frontmatter.date = date.toISOString().split('T')[0]
          }
        }
        const post = {
          frontMatter: page.frontmatter as PostFrontMatter,
          regularPath: page.url,
          rawContent: page.src,
          html: page.html
        } as Post
        if (Array.isArray(post.frontMatter.tags)) {
          post.frontMatter.tags = [
            ...new Set(post.frontMatter.tags.map((t) => String(t).trim()))
          ]
        }
        return post
      })
      .sort((a, b) => {
        return +new Date(b.frontMatter.date) - +new Date(a.frontMatter.date)
      })
  }
})
