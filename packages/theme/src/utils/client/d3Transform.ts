import {
  D3Data,
  D3Link,
  D3Node,
  // MarkdownMetadata,
  SiteMetadata
} from '../../types/types'
import { data as allPostsData } from '../node/posts.data'
import { getTitleFromPost } from './title'

type PageGraphLink = SiteMetadata[string]['outgoingLinks'][number]

const normalizeMetadataKey = (path: string): string =>
  path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')

const hasPageMetadata = (path: string, siteMetadata: SiteMetadata): boolean => {
  if (siteMetadata[path]) return true

  const normalizedPath = normalizeMetadataKey(path)
  return Boolean(
    siteMetadata[normalizedPath] || siteMetadata[`/${normalizedPath}`]
  )
}

const isRenderableGraphLink = (
  link: PageGraphLink,
  siteMetadata: SiteMetadata
): boolean =>
  link.type !== 'wiki' || hasPageMetadata(link.relativePath, siteMetadata)

/**
 * Builds the local neighborhood graph for the current page so page views stay focused.
 *
 * @param currentPath - Current page path used as the graph center.
 * @param siteMetadata - Analyzer metadata containing page relationships.
 * @returns D3 graph data for the current page and directly related pages.
 */
const transformPageD3Data = (
  currentPath: string,
  siteMetadata: SiteMetadata
): D3Data => {
  const currentPageData = siteMetadata[currentPath]
  if (!currentPageData) {
    return {
      nodes: [],
      links: []
    }
  }

  // Store unique nodes in a map
  const nodesMap = new Map<string, D3Node>()
  const outgoingLinks =
    currentPageData.outgoingLinks?.filter((link) =>
      isRenderableGraphLink(link, siteMetadata)
    ) || []
  const backLinks =
    currentPageData.backLinks?.filter((link) =>
      isRenderableGraphLink(link, siteMetadata)
    ) || []

  // Add current page as source node
  nodesMap.set(currentPath, {
    id: currentPath,
    relativePath: currentPath,
    fullUrl: '/' + currentPath,
    name: getTitleFromPost(
      {
        relativePath: currentPath,
        fullUrl: '/' + currentPath,
        text: currentPath.split('/').pop() || currentPath,
        absolutePath: currentPath,
        type: 'markdown',
        raw: currentPath
      },
      allPostsData || []
    ),
    type: 'page',
    inDegree: backLinks.length,
    outDegree: outgoingLinks.length
  })

  // Add nodes from outgoing links
  outgoingLinks.forEach((link) => {
    if (!nodesMap.has(link.relativePath)) {
      nodesMap.set(link.relativePath, {
        id: link.relativePath,
        relativePath: link.relativePath,
        name: getTitleFromPost(
          { ...link, absolutePath: link.relativePath },
          allPostsData || []
        ),
        fullUrl: link.fullUrl,
        type: link.type,
        inDegree: 1,
        outDegree: siteMetadata[link.relativePath]?.outgoingLinks?.length || 0
      })
    }
  })

  // Add nodes from back links
  backLinks.forEach((link) => {
    if (!nodesMap.has(link.relativePath)) {
      nodesMap.set(link.relativePath, {
        id: link.relativePath,
        relativePath: link.relativePath,
        name: getTitleFromPost(
          { ...link, absolutePath: link.relativePath },
          allPostsData || []
        ),
        fullUrl: link.fullUrl,
        type: link.type,
        inDegree: siteMetadata[link.relativePath]?.backLinks?.length || 0,
        outDegree: 1
      })
    }
  })

  // Create links array
  const links = [
    // Outgoing links
    ...outgoingLinks.map((link) => ({
      source: currentPath,
      target: link.relativePath,
      type: link.type
    })),
    // Back links
    ...backLinks.map((link) => ({
      source: link.relativePath,
      target: currentPath,
      type: link.type
    }))
  ]

  return {
    nodes: Array.from(nodesMap.values()),
    links
  }
}

// TODO: maybe we need pre calculate
/**
 * Builds a whole-site relationship graph for overview visualizations.
 *
 * @param siteMetadata - Analyzer metadata containing all page relationships.
 * @returns D3 graph data for the entire analyzed site.
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
    const outgoingLinks = metadata.outgoingLinks.filter((link) =>
      isRenderableGraphLink(link, siteMetadata)
    )

    // Add current page as a node
    getOrCreateNode(
      path,
      path.split('/').pop() || path,
      '/' + path,
      'page',
      0,
      outgoingLinks.length
    )

    // Add target nodes from page's outgoing links
    outgoingLinks.forEach((link) => {
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
    metadata.outgoingLinks
      .filter((link) => isRenderableGraphLink(link, siteMetadata))
      .forEach((link) => {
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

export { transformPageD3Data, transformSiteD3Data }
