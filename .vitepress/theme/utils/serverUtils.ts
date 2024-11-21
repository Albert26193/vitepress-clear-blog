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
import Page from "../../.vitepress/theme/components/Page.vue";
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (pageNum - 1)},${pageSize * pageNum})
</script>
<Page :posts="posts" :pageCurrent="${pageNum}" :pagesNum="${pagesNum}" />
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
 * @abstract: Calculate the number of words in the post
 * @param content: the content of the post to calculate
 */
const calculateWords = (content: string): number => {
  const pattern =
    /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = content.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length
    } else {
      count += 1
    }
  }
  return count
}

/**
 * @abstract: Calculate the reading time of the post
 *
 * @param content the content of post to calculate
 * @returns the reading time of the post
 */
const calculateReadingTime = (content: string) => {
  const words = calculateWords(content)
  return Math.ceil(words / 110)
}

export {
  getPosts,
  parseToml,
  parsedConfigToml,
  assignedConfigPath,
  calculateWords
}
