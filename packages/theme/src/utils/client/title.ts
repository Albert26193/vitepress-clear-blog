import type { PageLink } from 'vitepress-plugin-analyzer/types'

import type { Post } from '../../types/types'
import { resolveLinkTitle } from './resolve-title'

/**
 * Get title from corresponding post using useTitle logic
 */
const getTitleFromPost = (
  link: PageLink,
  allPosts: Post[],
  renderTitle = 'frontmatter_title'
): string => {
  return resolveLinkTitle(
    { ...link, relativePath: link.relativePath.replace(/^\/+/, '') },
    allPosts || [],
    renderTitle
  )
}

export { getTitleFromPost, resolveLinkTitle }
