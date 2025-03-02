import fsExtra from 'fs-extra'
import { globby } from 'globby'
import matter from 'gray-matter'
import path, { resolve } from 'path'

import { Post, PostFrontMatter } from '../../types/types.d'

/**
 * Get all posts and generate pagination pages
 *
 * @param pageSize Number of posts per page
 * @returns List of posts
 */
const getPosts = async (pageSize: number): Promise<Post[]> => {
  const rootPath = getRootPath()
  // console.log('Root Path:', rootPath)

  const blogPattern = resolve(rootPath, 'docs/blogs/**/*.md')
  // console.log('Blog Pattern:', blogPattern)

  const paths = await globby([blogPattern])
  // console.log('Found blog files:', paths)

  if (paths.length === 0) {
    // console.warn('No blog posts found!')
    return []
  }

  // await generatePaginationPages(paths.length, pageSize)

  const posts = await Promise.all(
    paths.map(async (item) => {
      // console.log('Processing blog file:', item)
      const content = await fsExtra.readFile(item, 'utf-8')
      const parsed = matter(content)
      if (!parsed.data.title || !parsed.data.date) {
        throw new Error(`Invalid frontmatter in ${item}: missing title or date`)
      }
      const data = parsed.data as PostFrontMatter

      data.date = _convertDate(data.date)
      const path = item.split('docs/').pop() as string

      return {
        frontMatter: data,
        regularPath: `/${path.replace('.md', '.html')}`
      }
    })
  )
  posts.sort(_compareDate)

  return posts
}

/**
 * Convert date to YYYY-MM-DD format
 *
 * @param date Date string
 * @returns Date string in YYYY-MM-DD format
 */
function _convertDate(date = new Date().toString()) {
  const json_date = new Date(date).toJSON()

  return json_date.split('T')[0]
}

/**
 * Compare two posts by date
 *
 * @param a First post
 * @param b Second post
 * @returns 1 if a is newer than b, -1 otherwise
 */
function _compareDate(a: Post, b: Post): number {
  return a.frontMatter.date < b.frontMatter.date ? 1 : -1
}

/**
 * Get root path for project
 */
const getRootPath = () => {
  const rootPath = path.resolve(process.cwd())
  // console.log('Current working directory:', process.cwd())
  // console.log('Resolved root path:', rootPath)
  return rootPath
}

/**
 * Get src path for project
 *
 * @param srcName - src name
 * @returns src path
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

export { getPosts, getRootPath, getSrcPath }
