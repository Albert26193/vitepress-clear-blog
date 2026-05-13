import type { PageLink } from 'vitepress-plugin-analyzer/types'

import type { Post } from '../../types/types'

/**
 * Resolves a display title for a link target, controlled by renderTitle mode.
 * Accepts both PageLink objects (from analyzer) and plain path strings (from DOM).
 * Keep this module free of heavy dependencies — it's imported from wikilink.ts (jsdom tests).
 */
const resolveLinkTitle = (
  linkOrPath: PageLink | string,
  allPosts: Post[],
  renderTitle: string,
  fallbackText?: string
): string => {
  const relativePath =
    typeof linkOrPath === 'string' ? linkOrPath : linkOrPath.relativePath
  const text =
    typeof linkOrPath === 'string' ? fallbackText || '' : linkOrPath.text || ''

  // fallback when post not found: use fullUrl basename for PageLink, or filename from path
  const fullUrlBasename =
    typeof linkOrPath === 'string'
      ? undefined
      : linkOrPath.fullUrl.split('/').pop()

  switch (renderTitle) {
    case 'file_name':
      return (
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') ||
        text ||
        ''
      )

    case 'alias':
      return text || ''

    case 'frontmatter_title':
    case 'first_heading': {
      let linkPath: string
      if (relativePath.endsWith('.md')) {
        linkPath = '/' + relativePath.replace(/\.md$/, '.html')
      } else {
        linkPath = '/' + relativePath + '.html'
      }

      const matchedPost = allPosts.find(
        (post: Post) => post.regularPath === linkPath
      )

      if (!matchedPost) {
        return (
          text ||
          fullUrlBasename ||
          relativePath
            .split('/')
            .pop()
            ?.replace(/\.(md|html)$/, '') ||
          ''
        )
      }

      if (renderTitle === 'frontmatter_title') {
        return (
          matchedPost.frontMatter.title ||
          relativePath
            .split('/')
            .pop()
            ?.replace(/\.(md|html)$/, '') ||
          text ||
          ''
        )
      }

      // first_heading: extract h1/h2 from rendered HTML
      if (typeof document !== 'undefined') {
        const div = document.createElement('div')
        div.innerHTML = matchedPost.html || ''
        const heading = div.querySelector('h1, h2')
        if (heading?.textContent) {
          return heading.textContent.trim()
        }
      }

      return (
        matchedPost.frontMatter.title ||
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') ||
        text ||
        ''
      )
    }

    default:
      return (
        text ||
        fullUrlBasename ||
        relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') ||
        ''
      )
  }
}

export { resolveLinkTitle }
