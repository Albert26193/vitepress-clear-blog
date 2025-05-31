import type { PageLink } from 'vitepress-plugin-analyzer/types'

import { useTitle } from '../../composables/useMeta'
import type { Post } from '../../types/types'

/**
 * Get title from corresponding post using useTitle logic
 * 1. Find the post by matching relativePath with regularPath
 * 2. Use useTitle with the found post's frontMatter and html
 * 3. Fallback to link text or path if no post found
 *
 * @param link - The PageLink to get title for
 * @param allPosts - Array of all posts data
 * @returns The title string
 */
const getTitleFromPost = (link: PageLink, allPosts: Post[]): string => {
  if (!allPosts) {
    return link.text || link.fullUrl.split('/').pop() || ''
  }

  // Convert link.relativePath to match post.regularPath format
  // link.relativePath might be "blogs/tech/something.md" OR "blogs/tech/something" (without extension)
  // post.regularPath is like "/blogs/tech/something.html"
  let linkPath: string
  if (link.relativePath.endsWith('.md')) {
    // If it has .md extension, replace with .html
    linkPath = '/' + link.relativePath.replace(/\.md$/, '.html')
  } else {
    // If it doesn't have extension, add .html
    linkPath = '/' + link.relativePath + '.html'
  }

  // Find the corresponding post
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

  // Fallback: use link text or extract filename from path
  return link.text || link.fullUrl.split('/').pop() || ''
}

export { getTitleFromPost }
