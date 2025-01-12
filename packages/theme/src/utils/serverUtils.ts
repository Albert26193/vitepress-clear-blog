import { Post, PostFrontMatter } from '@theme/types/types'
import fsExtra from 'fs-extra'
import { globby } from 'globby'
import matter from 'gray-matter'
import path, { resolve } from 'path'
import { parse } from 'smol-toml'

/**
 * Get all posts and generate pagination pages
 *
 * @param pageSize Number of posts per page
 * @returns List of posts
 */
const getPosts = async (pageSize: number): Promise<Post[]> => {
  const rootPath = getRootPath()
  console.log('Root Path:', rootPath)

  const blogPattern = resolve(rootPath, 'docs/blogs/**/*.md')
  console.log('Blog Pattern:', blogPattern)

  const paths = await globby([blogPattern])
  console.log('Found blog files:', paths)

  if (paths.length === 0) {
    console.warn('No blog posts found!')
    return []
  }

  await generatePaginationPages(paths.length, pageSize)

  const posts = await Promise.all(
    paths.map(async (item) => {
      console.log('Processing blog file:', item)
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
 * Generate pagination pages
 *
 * @param total Total number of posts
 * @param pageSize Number of posts per page
 */
const generatePaginationPages = async (
  total: number,
  pageSize: number
): Promise<void> => {
  const pagesNum =
    total % pageSize === 0 ? total / pageSize : Math.floor(total / pageSize) + 1
  const rootPath = getRootPath()
  const basePath = resolve(rootPath, 'docs/pages')

  console.log('Pagination Path:', basePath)
  console.log('Total posts:', total)
  console.log('Page size:', pageSize)
  console.log('Total pages:', pagesNum)

  if (total <= 0) return

  // 确保目录存在
  await fsExtra.ensureDir(basePath)

  const generatePage = (pageNum: number) =>
    `
---
title: ${pageNum === 1 ? 'home' : 'page_' + pageNum}
aside: false
sidebar: false
layout: page
---
<script setup>
import BlogContainer from "../../src/components/page/BlogContainer.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (pageNum - 1)},${pageSize * pageNum})
</script>
<BlogContainer :posts="posts" :pageCurrent="${pageNum}" :pagesNum="${pagesNum}" />
`.trim()

  await Promise.all(
    Array.from({ length: pagesNum }, (_, i) => i + 1).map(async (pageNum) => {
      const filePath = resolve(basePath, `page_${pageNum}.md`)
      console.log('Creating page file:', filePath)
      await fsExtra.writeFile(filePath, generatePage(pageNum))
    })
  )

  const sourcePath = resolve(basePath, 'page_1.md')
  const targetPath = resolve(basePath, 'index.md')
  console.log('Moving first page:', sourcePath, '->', targetPath)

  await fsExtra.move(sourcePath, targetPath, {
    overwrite: true
  })
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
  console.log('Current working directory:', process.cwd())
  console.log('Resolved root path:', rootPath)
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

/**
 * Parse custom config file(.toml)
 *
 * @param configPath the path of the config file
 * @return the parsed config object
 */
const parseToml = async (configPath: string) => {
  const configContent = await fsExtra.readFile(configPath, 'utf-8')
  return parse(configContent)
}
const assignedConfigPath = path.resolve(__dirname, '../../custom/config.toml')
const parsedConfigToml = await parseToml(assignedConfigPath)

export {
  getPosts,
  generatePaginationPages,
  parseToml,
  parsedConfigToml,
  assignedConfigPath,
  getRootPath,
  getSrcPath
}
