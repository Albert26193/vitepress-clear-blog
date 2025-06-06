import {
  D3Data,
  D3Link,
  D3Node,
  // MarkdownMetadata,
  SiteMetadata
} from '../../types/types.d'
import { data as allPostsData } from '../node/posts.data'
import { getTitleFromPost } from './title'

/**
 * Transform post links into D3 force graph data structure for current page
 *
 * @param {string} currentPath Path of the current page
 * @param {SiteMetadata} siteMetadata Metadata containing all pages and their links
 * @returns {D3Data} D3 force graph data structure with nodes and links
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

  // Add current page as source node
  nodesMap.set(currentPath, {
    id: currentPath,
    relativePath: currentPath,
    fullUrl: currentPath,
    name: getTitleFromPost(
      {
        relativePath: currentPath,
        fullUrl: currentPath,
        text: currentPath.split('/').pop() || currentPath,
        absolutePath: currentPath,
        type: 'markdown',
        raw: currentPath
      },
      allPostsData || []
    ),
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
  currentPageData.backLinks?.forEach((link) => {
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

export { transformPageD3Data, transformSiteD3Data }
