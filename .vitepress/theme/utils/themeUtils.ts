import {
  D3Data,
  D3Link,
  D3Node,
  PageLink,
  Post,
  SiteMetadata
} from '@/theme/types'
import mediumZoom from 'medium-zoom'

/**
 * @abstract Initialize tags from posts and group posts by tag
 * @param post Array of posts to process
 * @returns Record object with tags as keys and arrays of posts as values
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
 * @abstract Sort posts by year and return them as nested arrays
 * @param posts Array of posts to sort
 * @returns Array of arrays, where each inner array contains posts from the same year
 */
const useYearSort = (posts: Post[]): Post[][] => {
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
 * @abstract Sort posts by year and month, organizing them in a nested structure
 * @param posts Array of posts to sort
 * @returns Nested record object with years as top-level keys and months as second-level keys
 */
const useMonthYearSort = (
  posts: Post[]
): Record<string, Record<string, Post[]>> => {
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
 * @abstract Calculate the number of words in the post
 * @param content The content of the post to calculate
 * @returns Number of words, counting Chinese characters individually
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

const mediumZoomInit = () => {
  const zoom = mediumZoom('.main img', {
    background: 'var(--vp-c-bg)',
    margin: 48
  })
  zoom.on('open', () => {
    document.querySelectorAll('.shiki [data-language]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none'
      }
    })
  })
  zoom.on('close', () => {
    document.querySelectorAll('.shiki [data-language]').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = ''
      }
    })
  })
}

/**
 * Transform post links into D3 force graph data structure for current page
 *
 * @param postLinks Links from the current page to other pages
 * @param currentPath Path of the current page
 * @returns D3 force graph data structure with nodes and links
 */
const transformPageD3Data = (
  postLinks: PageLink[],
  currentPath: string
): D3Data => {
  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()

  // Add current page as source node
  if (!nodesMap.has(currentPath)) {
    nodesMap.set(currentPath, {
      id: currentPath,
      text: currentPath.split('/').pop() || currentPath,
      type: 'page'
    })
  }

  // Add target nodes from links
  postLinks.forEach((link) => {
    if (!nodesMap.has(link.path)) {
      nodesMap.set(link.path, {
        id: link.path,
        text: link.text,
        type: link.type
      })
    }
  })

  // Convert to D3 data structure
  return {
    nodes: Array.from(nodesMap.values()),
    links: postLinks.map((link) => ({
      source: currentPath,
      target: link.path,
      type: link.type
    }))
  }
}

/**
 * Transform all site links into D3 force graph data structure
 *
 * @param siteMetadata Metadata containing all pages and their links
 * @returns D3 force graph data structure with nodes and links for the entire site
 */
const transformSiteD3Data = (siteMetadata: SiteMetadata): D3Data => {
  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()

  // Process all pages
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    // Add current page as a node
    if (!nodesMap.has(path)) {
      nodesMap.set(path, {
        id: path,
        text: path.split('/').pop() || path,
        type: 'page',
        group: path.split('/').length - 1
      })
    }

    // Add target nodes from page's inner links
    metadata.innerLinks.forEach((link) => {
      if (!nodesMap.has(link.path)) {
        nodesMap.set(link.path, {
          id: link.path,
          text: link.text,
          type: link.type
        })
      }
    })
  })

  // Collect all links between pages
  const links: D3Link[] = []
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    metadata.innerLinks.forEach((link) => {
      links.push({
        source: path,
        target: link.path,
        type: link.type
      })
    })
  })

  // Convert to D3 data structure
  return {
    nodes: Array.from(nodesMap.values()),
    links
  }
}

export {
  initTags,
  useYearSort,
  useMonthYearSort,
  calculateWords,
  mediumZoomInit,
  transformPageD3Data,
  transformSiteD3Data
}
