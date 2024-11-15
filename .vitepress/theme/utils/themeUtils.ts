import { Post } from '../types'

export function initTags(post: Post[]) {
  const data: Record<string, Post[]> = {}

  for (let index = 0; index < post.length; index++) {
    const element = post[index]
    const tags = element.frontMatter.tags

    if (tags) {
      tags.forEach((item) => {
        if (data[item]) {
          data[item].push(element)
        } else {
          data[item] = []
          data[item].push(element)
        }
      })
    }
  }

  return data
}

export function useYearSort(posts: Post[]): Post[][] {
  const sortedByYear = posts.reduce((acc: Record<string, Post[]>, post: Post) => {
    if (post.frontMatter.date) {
      const year = post.frontMatter.date.split('-')[0]
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(post)
    }
    return acc
  }, {})

  const sortedYears = Object.keys(sortedByYear).sort((a, b) => b.localeCompare(a))
  const sortedPostsByYear = sortedYears.map((year) => sortedByYear[year])
  return sortedPostsByYear
}

export function useMonthYearSort(posts: Post[]): Record<string, Record<string, Post[]>> {
  return posts.reduce((acc: Record<string, Record<string, Post[]>>, post: Post) => {
    if (post.frontMatter.date) {
      const [year, month] = post.frontMatter.date.split('-')
      acc[year] = acc[year] || {}
      acc[year][month] = acc[year][month] || []
      acc[year][month].push(post)
    }
    return acc
  }, {})
}
