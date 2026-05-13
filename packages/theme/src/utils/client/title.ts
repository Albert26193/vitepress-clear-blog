import type { PageLink } from 'vitepress-plugin-analyzer/types'

import { useTitle } from '../../composables/useMeta'
import type { Post } from '../../types/types'
import { resolveLinkTitle } from './resolve-title'

/**
 * Get title from corresponding post using useTitle logic
 */
const getTitleFromPost = (link: PageLink, allPosts: Post[]): string => {
  if (!allPosts) {
    return link.text || link.fullUrl.split('/').pop() || ''
  }

  let linkPath: string
  if (link.relativePath.endsWith('.md')) {
    linkPath = '/' + link.relativePath.replace(/\.md$/, '.html')
  } else {
    linkPath = '/' + link.relativePath + '.html'
  }

  const matchedPost = allPosts.find((post: Post) => {
    return post.regularPath === linkPath
  })

  if (matchedPost) {
    const title = useTitle(matchedPost.frontMatter, matchedPost.html || '')
    return (
      title ||
      matchedPost.regularPath
        .split('/')
        .pop()
        ?.replace(/\.html$/, '') ||
      ''
    )
  }

  return link.text || link.fullUrl.split('/').pop() || ''
}

export { getTitleFromPost, resolveLinkTitle }
