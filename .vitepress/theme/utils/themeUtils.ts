import {
  D3Data,
  D3Link,
  D3Node,
  PageLink,
  Post,
  SiteMetadata
} from '@/theme/types.d'
import mediumZoom from 'medium-zoom'

/**
 * Initialize tags from posts and group posts by tag
 *
 * @param {Post[]} post Array of posts to process
 * @returns {Record<string, Post[]>} Record object with tags as keys and arrays of posts as values
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
 * Sorts posts by year and returns them as nested arrays
 *
 * @param {Post[]} posts Array of posts to sort
 * @returns {Post[][]} Array of arrays, where each inner array contains posts from the same year
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
 * Sorts posts by year and month, organizing them in a nested structure
 *
 * @param {Post[]} posts Array of posts to sort
 * @returns {Record<string, Record<string, Post[]>>} Nested record object with years as top-level keys and months as second-level keys
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
 * Calculates the number of words in the post
 *
 * @param {string} content The content of the post to calculate
 * @returns {number} Number of words, counting Chinese characters individually
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
 * function for Initialize medium-zoom with custom options
 *
 * @returns {void}
 */
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
 * @param {PageLink[]} postLinks Links from the current page to other pages
 * @param {string} currentPath Path of the current page
 * @returns {D3Data} D3 force graph data structure with nodes and links
 */
const transformPageD3Data = (
  postLinks: PageLink[],
  currentPath: string
): D3Data => {
  if (!postLinks.length) {
    return {
      nodes: [],
      links: []
    }
  }

  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()

  // Add current page as source node
  if (!nodesMap.has(currentPath)) {
    nodesMap.set(currentPath, {
      id: currentPath,
      relativePath: currentPath,
      fullUrl: currentPath,
      name: currentPath.split('/').pop() || currentPath,
      type: 'page',
      inDegree: 0,
      outDegree: postLinks.length
    })
  }

  // Add target nodes from links
  postLinks.forEach((link) => {
    if (!nodesMap.has(link.relativePath)) {
      nodesMap.set(link.relativePath, {
        id: link.relativePath,
        relativePath: link.relativePath,
        name: link.text.split('/').pop() || link.text,
        fullUrl: link.fullUrl,
        type: link.type,
        inDegree: 0,
        outDegree: 0
      })
    } else {
      // If node already exists, increment its inDegree
      const node = nodesMap.get(link.relativePath)!
      node.inDegree++
    }
  })

  // Convert to D3 data structure
  return {
    nodes: Array.from(nodesMap.values()),
    links: postLinks.map((link) => ({
      source: currentPath,
      target: link.relativePath,
      type: link.type
    }))
  }
}

/**
 * Transform all site links into D3 force graph data structure
 *
 * @param {SiteMetadata} siteMetadata Metadata containing all pages and their links
 * @returns {D3Data} D3 force graph data structure with nodes and links for the entire site
 */
const transformSiteD3Data = (siteMetadata: SiteMetadata): D3Data => {
  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()

  // First pass: Create all nodes with initial degree values
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    // Add current page as a node
    if (!nodesMap.has(path)) {
      nodesMap.set(path, {
        id: path,
        relativePath: path,
        name: path.split('/').pop() || path,
        fullUrl: path,
        type: 'page',
        group: path.split('/').length - 1,
        inDegree: 0,
        outDegree: metadata.innerLinks.length
      })
    }

    // Add target nodes from page's inner links
    metadata.innerLinks.forEach((link) => {
      if (!nodesMap.has(link.relativePath)) {
        nodesMap.set(link.relativePath, {
          id: link.relativePath,
          relativePath: link.relativePath,
          name: link.text,
          fullUrl: link.fullUrl,
          type: link.type,
          inDegree: 0,
          outDegree: 0
        })
      } else {
        // If node already exists, increment its inDegree
        const node = nodesMap.get(link.relativePath)!
        node.inDegree++
      }
    })
  })

  // Collect all links between pages
  const links: D3Link[] = []
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    metadata.innerLinks.forEach((link) => {
      links.push({
        source: path,
        target: link.relativePath,
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
