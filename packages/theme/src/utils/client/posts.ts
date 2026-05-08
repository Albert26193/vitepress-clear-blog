import mediumZoom from 'medium-zoom'

import { Post } from '../../types/types.d'

/**
 * Groups posts by tag so tag pages can reuse one normalized lookup table.
 *
 * @param post Array of posts to group.
 * @returns Posts keyed by tag name.
 */
const initTags = (post: Post[]) => {
  const data: Record<string, Post[]> = {}
  for (let index = 0; index < post.length; index++) {
    const element = post[index]
    const tags = element.frontMatter.tags
    if (tags) {
      tags.forEach((item: string) => {
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

/**
 * Groups posts by year for archive views that need stable reverse-chronological buckets.
 *
 * @param posts Posts to organize by frontmatter year.
 * @returns Year buckets ordered from newest to oldest.
 */
const useYearSort = (posts: Post[]): Post[][] => {
  if (!posts) {
    return []
  }
  const sortedByYear = posts.reduce(
    (acc: Record<string, Post[]>, post: Post) => {
      if (post.frontMatter.date) {
        const year = post.frontMatter.date.split('-')[0]
        if (!acc[year]) {
          acc[year] = []
        }
        acc[year].push(post)
      }
      return acc
    },
    {}
  )
  const sortedYears = Object.keys(sortedByYear).sort((a, b) =>
    b.localeCompare(a)
  )
  const sortedPostsByYear = sortedYears.map((year) => sortedByYear[year])
  return sortedPostsByYear
}

/**
 * Groups posts by year and month for calendar-like archive navigation.
 *
 * @param posts Posts to organize by frontmatter date.
 * @returns Nested year and month buckets.
 */
const useMonthYearSort = (
  posts: Post[]
): Record<string, Record<string, Post[]>> => {
  if (!posts) {
    return {}
  }
  return posts.reduce(
    (acc: Record<string, Record<string, Post[]>>, post: Post) => {
      if (post.frontMatter.date) {
        const [year, month] = post.frontMatter.date.split('-')
        acc[year] = acc[year] || {}
        acc[year][month] = acc[year][month] || []
        acc[year][month].push(post)
      }
      return acc
    },
    {}
  )
}

/**
 * Counts mixed-language content for reading-time and metadata displays.
 *
 * @param content Content to count after Markdown has been loaded.
 * @returns Word-like count with CJK characters counted individually.
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
 * Initializes medium-zoom for article images while avoiding layout artifacts from code labels.
 *
 * @returns Nothing; zoom handlers are attached to matching DOM elements.
 */
const mediumZoomInit = () => {
  // Select images from both main content and mermaid diagrams
  const zoom = mediumZoom('.main img, .mermaid-diagram', {
    background: 'var(--vp-c-bg)',
    margin: 18,
    scrollOffset: 80
  })

  zoom.on('open', () => {
    // Hide code language labels when zoom is open
    document.querySelectorAll('.shiki [data-language]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none'
      }
    })

    // Add a class to body to prevent scrolling
    document.body.style.overflow = 'hidden'
  })

  zoom.on('close', () => {
    // Restore code language labels when zoom is closed
    document.querySelectorAll('.shiki [data-language]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = ''
      }
    })

    // Restore body scrolling
    document.body.style.overflow = ''
  })
}

export {
  initTags,
  useYearSort,
  useMonthYearSort,
  calculateWords,
  mediumZoomInit
}
