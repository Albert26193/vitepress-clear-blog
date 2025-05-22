import { createContentLoader } from 'vitepress'

import type { Post, PostFrontMatter } from '../../types/types.d'

// console.log('[posts.data.ts] Current Working Directory:', process.cwd()); // Keep this for now if helpful

declare const data: Post[]
export { data }

export default createContentLoader<Post[]>('blogs/**/*.md', {
  includeSrc: true,
  render: true,
  transform(rawData) {
    console.log(
      '[posts.data.ts] Raw data loaded by createContentLoader:',
      JSON.stringify(rawData, null, 2)
    )
    if (!rawData || rawData.length === 0) {
      // console.warn(
      //   '[posts.data.ts] No raw data loaded. Check your glob pattern and srcDir in VitePress config.'
      // );
    }
    return rawData
      .map((page) => {
        if (page.frontmatter.date) {
          const date = new Date(page.frontmatter.date)
          page.frontmatter.date = date.toISOString().split('T')[0]
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
