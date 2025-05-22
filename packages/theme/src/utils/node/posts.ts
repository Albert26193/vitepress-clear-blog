import { createContentLoader } from 'vitepress'

import type { Post, PostFrontMatter } from '../../types/types'

// console.log('[posts.data.ts] Current Working Directory:', process.cwd())

// Declare the shape of the data that will be available after VitePress processing
declare const data: Post[]
export { data }

export default createContentLoader<Post[]>('blogs/**/*.md', {
  transform(rawData) {
    // --- DEBUG START ---
    // console.log(
    //   '[posts.data.ts] Raw data loaded by createContentLoader:',
    //   JSON.stringify(rawData, null, 2)
    // )
    // if (!rawData || rawData.length === 0) {
    //   console.warn(
    //     '[posts.data.ts] No raw data loaded. Check your glob pattern and srcDir in VitePress config.'
    //   )
    // }
    // --- DEBUG END ---
    return rawData
      .map((page) => {
        // Ensure date is in YYYY-MM-DD format
        if (page.frontmatter.date) {
          const date = new Date(page.frontmatter.date)
          page.frontmatter.date = date.toISOString().split('T')[0]
        }
        // Transform to Post structure
        const post = {
          frontMatter: page.frontmatter as PostFrontMatter,
          regularPath: page.url
          // rawContent could be added if includeSrc or render is true in createContentLoader options
        } as Post
        // --- DEBUG START ---
        // console.log('[posts.data.ts] Transformed page object:', JSON.stringify(page, null, 2)); // Logging mapped 'page' (which is 'Post' type here)
        // --- DEBUG END ---
        return post
      })
      .sort((a, b) => {
        // Sort by date using the frontMatter from the Post structure
        return +new Date(b.frontMatter.date) - +new Date(a.frontMatter.date)
      })
  }
})
