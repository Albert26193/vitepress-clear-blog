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
        if (page.frontmatter.date) {
          const normalized = normalizePostDate(
            page.frontmatter as Record<string, unknown>
          )
          if (normalized) {
            page.frontmatter.date = normalized
          }
        }
        const post = {
          frontMatter: page.frontmatter as PostFrontMatter,
          regularPath: page.url,
          rawContent: page.src,
          html: page.html
        } as Post
        return post
      })
      .sort((a, b) => {
        return +new Date(b.frontMatter.date) - +new Date(a.frontMatter.date)
      })
  }
})
