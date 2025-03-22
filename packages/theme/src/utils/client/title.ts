import type { PageLink, SitePages } from 'vitepress-plugin-analyzer/types'

import type { Post } from '../../types/types'

/**
 * Get the title of a link based on the first heading of the page or the text of the link:
 * 1. first use first heading of the page
 * 2. if no heading, use the last word of the relative path of the link
 * 3. if no relative path, use the text of the link
 *
 * @param sitePages - The site pages metadata
 * @param currentLink - The link to get the title for
 * @returns The title of the link
 */
const getLinkTitle = (sitePages: SitePages, currentLink: PageLink): string => {
  return sitePages[currentLink.relativePath]?.metadata?.firstHeading ==
    'no-heading'
    ? currentLink.fullUrl.split('/').pop() || currentLink.text
    : sitePages[currentLink.relativePath]?.metadata?.firstHeading ||
        currentLink.text
}

const getPostTitle = (post: Post): string => {
  return post.frontMatter.title || post.regularPath.split('/').pop() || ''
}

export { getLinkTitle, getPostTitle }
