import fs from 'fs-extra'
import { globby } from 'globby'
import matter from 'gray-matter'
import path, { resolve } from 'path'
import { parse } from 'smol-toml'

import { Post, PostFrontMatter } from '../types'

/**
import { Theme } from 'vitepress'
import { Theme } from 'vitepress'
 * @abstract Get all posts and generate pagination pages
 * @param pageSize Number of posts per page
 * @returns List of posts
 */
const getPosts = async (pageSize: number): Promise<Post[]> => {
  const paths = await globby([
    'docs/blogs/**/*.md'
    // 'docs/collections/**/**.md'
  ])
  await generatePaginationPages(paths.length, pageSize)

  const posts = await Promise.all(
    paths.map(async (item) => {
      const content = await fs.readFile(item, 'utf-8')
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
 * @abstract Generate pagination pages
 * @param total Total number of posts
 * @param pageSize Number of posts per page
 */
const generatePaginationPages = async (
  total: number,
  pageSize: number
): Promise<void> => {
  const pagesNum =
    total % pageSize === 0 ? total / pageSize : Math.floor(total / pageSize) + 1
  const basePath = resolve('./docs/pages')

  if (total <= 0) return

  const generatePage = (pageNum: number) =>
    `
---
title: ${pageNum === 1 ? 'home' : 'page_' + pageNum}
aside: false
layout: page
---
<script setup>
import BlogContainer from "../../.vitepress/theme/components/page/BlogContainer.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (pageNum - 1)},${pageSize * pageNum})
</script>
<BlogContainer :posts="posts" :pageCurrent="${pageNum}" :pagesNum="${pagesNum}" />
`.trim()

  await Promise.all(
    Array.from({ length: pagesNum }, (_, i) => i + 1).map(async (pageNum) => {
      const filePath = `${basePath}/page_${pageNum}.md`
      await fs.writeFile(filePath, generatePage(pageNum))
    })
  )

  await fs.move(`${basePath}/page_1.md`, `${basePath}/index.md`, {
    overwrite: true
  })
}

/**
 * @abstract Convert date to YYYY-MM-DD format
 *
 * @param date Date string
 * @returns Date string in YYYY-MM-DD format
 */
function _convertDate(date = new Date().toString()) {
  const json_date = new Date(date).toJSON()

  return json_date.split('T')[0]
}

/**
 * @abstract Compare two posts by date
 *
 * @param a First post
 * @param b Second post
 * @returns 1 if a is newer than b, -1 otherwise
 */
function _compareDate(a: Post, b: Post): number {
  return a.frontMatter.date < b.frontMatter.date ? 1 : -1
}

/**
 * @abstract: parse custom config file(.toml)
 *
 * @param configPath the path of the config file
 * @return the parsed config object
 */
const parseToml = async (configPath: string) => {
  const configContent = await fs.readFile(configPath, 'utf-8')
  return parse(configContent)
}
const assignedConfigPath = path.resolve(__dirname, '../../custom/config.toml')
const parsedConfigToml = await parseToml(assignedConfigPath)

/**
 * @abstract: get root path for project
 */
const getRootPath = () => {
  return path.resolve(process.cwd())
}

/**
 * @abstract: get src path for project
 * @param srcName - src name
 * @returns src path
 */
const getSrcPath = (srcName = 'src') => {
  const rootPath = getRootPath()
  return `${rootPath}/${srcName}`
}

export {
  getPosts,
  parseToml,
  parsedConfigToml,
  assignedConfigPath,
  getRootPath,
  getSrcPath
}
