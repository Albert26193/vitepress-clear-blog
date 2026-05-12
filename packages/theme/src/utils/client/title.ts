import type { PageLink } from 'vitepress-plugin-analyzer/types'

import { useTitle } from '../../composables/useMeta'
import type { Post } from '../../types/types'

/**
 * Resolves a display title for a wiki link target, controlled by renderTitle mode.
 *
 * @param link - The PageLink to get title for
 * @param allPosts - Array of all posts data
 * @param renderTitle - Which title source to use
 * @returns The resolved title string
 */
const resolveWikiLinkTitle = (
  link: PageLink,
  allPosts: Post[],
  renderTitle: string
): string => {
  switch (renderTitle) {
    case 'file_name':
      return (
        link.relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') ||
        link.text ||
        ''
      )

    case 'alias':
      return link.text || ''

    case 'frontmatter_title':
    case 'first_heading': {
      // Match by relativePath -> regularPath
      let linkPath: string
      if (link.relativePath.endsWith('.md')) {
        linkPath = '/' + link.relativePath.replace(/\.md$/, '.html')
      } else {
        linkPath = '/' + link.relativePath + '.html'
      }

      const matchedPost = allPosts.find(
        (post: Post) => post.regularPath === linkPath
      )

      if (!matchedPost) {
        return link.text || link.fullUrl.split('/').pop() || ''
      }

      if (renderTitle === 'frontmatter_title') {
        return (
          matchedPost.frontMatter.title ||
          link.relativePath
            .split('/')
            .pop()
            ?.replace(/\.(md|html)$/, '') ||
          link.text ||
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
        link.relativePath
          .split('/')
          .pop()
          ?.replace(/\.(md|html)$/, '') ||
        link.text ||
        ''
      )
    }

    default:
      return link.text || link.fullUrl.split('/').pop() || ''
  }
}

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

export { getTitleFromPost, resolveWikiLinkTitle }
