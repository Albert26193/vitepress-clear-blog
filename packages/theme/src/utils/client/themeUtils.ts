import {
  D3Data,
  D3Link,
  D3Node,
  MarkdownMetadata,
  Post,
  SiteMetadata
} from '@theme/types/types.d'
import 'heti/umd/heti.min.css'
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
 * @param {string} currentPath Path of the current page
 * @param {Record<string, MarkdownMetadata>} mdMetadata Metadata containing all pages and their links
 * @returns {D3Data} D3 force graph data structure with nodes and links
 */
const transformPageD3Data = (
  currentPath: string,
  mdMetadata: Record<string, MarkdownMetadata>
): D3Data => {
  const currentPageData = mdMetadata[currentPath]
  if (!currentPageData) {
    return {
      nodes: [],
      links: []
    }
  }

  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()

  // Add current page as source node
  nodesMap.set(currentPath, {
    id: currentPath,
    relativePath: currentPath,
    fullUrl: currentPath,
    name: currentPath.split('/').pop() || currentPath,
    type: 'page',
    inDegree: currentPageData.backLinks?.length || 0,
    outDegree: currentPageData.outgoingLinks?.length || 0
  })

  // Add nodes from outgoing links
  currentPageData.outgoingLinks?.forEach((link) => {
    if (!nodesMap.has(link.relativePath)) {
      nodesMap.set(link.relativePath, {
        id: link.relativePath,
        relativePath: link.relativePath,
        name: link.text.split('/').pop() || link.text,
        fullUrl: link.fullUrl,
        type: link.type,
        inDegree: 1,
        outDegree: mdMetadata[link.relativePath]?.outgoingLinks?.length || 0
      })
    }
  })

  // Add nodes from back links
  currentPageData.backLinks?.forEach((link) => {
    if (!nodesMap.has(link.relativePath)) {
      nodesMap.set(link.relativePath, {
        id: link.relativePath,
        relativePath: link.relativePath,
        name: link.text.split('/').pop() || link.text,
        fullUrl: link.fullUrl,
        type: link.type,
        inDegree: mdMetadata[link.relativePath]?.backLinks?.length || 0,
        outDegree: 1
      })
    }
  })

  // Create links array
  const links = [
    // Outgoing links
    ...(currentPageData.outgoingLinks?.map((link) => ({
      source: currentPath,
      target: link.relativePath,
      type: link.type
    })) || []),
    // Back links
    ...(currentPageData.backLinks?.map((link) => ({
      source: link.relativePath,
      target: currentPath,
      type: link.type
    })) || [])
  ]

  return {
    nodes: Array.from(nodesMap.values()),
    links
  }
}

// TODO: maybe we need pre calculate
/**
 * Transform all site links into D3 force graph data structure
 *
 * @param {SiteMetadata} siteMetadata Metadata containing all pages and their links
 * @returns {D3Data} D3 force graph data structure with nodes and links for the entire site
 */
const transformSiteD3Data = (siteMetadata: SiteMetadata): D3Data => {
  // Store unique nodes in a map
  // @key: normalized node ID (file path based on project root)
  // @value: node
  const nodesMap = new Map<string, D3Node>()

  // Helper function to normalize node ID
  const normalizeId = (path: string): string => {
    // Remove trailing slashes and normalize path separators
    // Also ensure consistent leading slash
    return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  }

  // Helper function to create or update node
  const getOrCreateNode = (
    path: string,
    name: string,
    fullUrl: string,
    type: string,
    inDegreeInc: number,
    outDegreeInc: number
  ): D3Node => {
    const normalizedId = normalizeId(path)
    const existingNode = nodesMap.get(normalizedId)

    if (existingNode) {
      existingNode.inDegree += inDegreeInc
      existingNode.outDegree += outDegreeInc
      return existingNode
    }

    const newNode: D3Node = {
      id: normalizedId,
      relativePath: path,
      name: name || path.split('/').pop() || path,
      fullUrl,
      type: 'wiki',
      inDegree: inDegreeInc,
      outDegree: outDegreeInc
    }
    nodesMap.set(normalizedId, newNode)
    return newNode
  }

  // First pass: Create all nodes with initial degree values
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    // Add current page as a node
    getOrCreateNode(
      path,
      path.split('/').pop() || path,
      path,
      'page',
      0,
      metadata.outgoingLinks.length
    )

    // Add target nodes from page's outgoing links
    metadata.outgoingLinks.forEach((link) => {
      getOrCreateNode(
        link.relativePath,
        link.text,
        link.fullUrl,
        link.type,
        1,
        0
      )
    })
  })

  // Collect all links between pages
  const links: D3Link[] = []
  Object.entries(siteMetadata).forEach(([path, metadata]) => {
    const sourceId = normalizeId(path)
    metadata.outgoingLinks.forEach((link) => {
      const targetId = normalizeId(link.relativePath)
      links.push({
        source: sourceId,
        target: targetId,
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

/**
 * Heti 类型声明
 */
interface HetiConstructor {
  new (selector: string): {
    autoSpacing: () => void
  }
}

// 扩展 Window 接口
declare global {
  interface Window {
    Heti: HetiConstructor
  }
}

/**
 * Init Heti class and scripts
 */
const initHeti = () => {
  const mainContent = document.querySelector(
    '#VPContent .VPDoc .content-container main.main'
  )

  if (!mainContent) {
    return
  }

  mainContent.classList.add('heti--classic')
  mainContent.classList.add('heti')

  if (typeof window.Heti === 'undefined') {
    const script = document.createElement('script')
    script.src = '//unpkg.com/heti/umd/heti-addon.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      if (typeof window.Heti !== 'undefined') {
        try {
          const heti = new window.Heti('.heti')
          heti.autoSpacing()
        } catch (error) {
          console.warn('Heti fail', error)
        }
      }
    }
    document.head.appendChild(script)
  } else {
    try {
      const heti = new window.Heti('.heti')
      heti.autoSpacing()
    } catch (error) {
      console.warn('Heti fail', error)
    }
  }
}

export {
  initTags,
  useYearSort,
  useMonthYearSort,
  calculateWords,
  mediumZoomInit,
  transformPageD3Data,
  transformSiteD3Data,
  initHeti
}
