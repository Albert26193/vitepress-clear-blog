import { createContentLoader } from 'vitepress'

import type { Post, PostFrontMatter } from '../../types/types.d'
import { normalizePostDate } from './datetime'

declare const data: Post[]
export { data }

export default createContentLoader<Post[]>('blogs/**/*.md', {
  includeSrc: true,
  render: true,
  transform(rawData) {
    return rawData
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
