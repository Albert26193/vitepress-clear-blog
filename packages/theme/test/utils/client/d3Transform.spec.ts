/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'

import type { SiteMetadata } from '../../../src/types/types.d'
import {
  transformPageD3Data,
  transformSiteD3Data
} from '../../../src/utils/client/d3Transform'

vi.mock('../../../src/utils/node/posts.data', () => ({
  data: []
}))

const emptyMetadata: SiteMetadata = {}

const singlePageMetadata: SiteMetadata = {
  '/page-a': {
    outgoingLinks: [
      {
        text: 'Page B',
        relativePath: '/page-b',
        fullUrl: '/page-b',
        type: 'markdown',
        raw: '/page-b'
      }
    ],
    backLinks: [],
    wordCount: 100,
    firstHeading: 'Page A',
    lastUpdated: 1000
  }
}

const twoPageMetadata: SiteMetadata = {
  '/page-a': {
    outgoingLinks: [
      {
        text: 'Page B',
        relativePath: '/page-b',
        fullUrl: '/page-b',
        type: 'markdown',
        raw: '/page-b'
      }
    ],
    backLinks: [],
    wordCount: 100,
    firstHeading: 'Page A',
    lastUpdated: 1000
  },
  '/page-b': {
    outgoingLinks: [],
    backLinks: [
      {
        text: 'Page A',
        relativePath: '/page-a',
        fullUrl: '/page-a',
        type: 'markdown',
        raw: '/page-a'
      }
    ],
    wordCount: 50,
    firstHeading: 'Page B',
    lastUpdated: 2000
  }
}

describe('transformPageD3Data', () => {
  it('returns empty nodes and links for empty metadata', () => {
    const result = transformPageD3Data('/nonexistent', emptyMetadata)
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
  })

  it('returns empty result when page not in metadata', () => {
    const result = transformPageD3Data('/not-there', singlePageMetadata)
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
  })

  it('creates current page as center node', () => {
    const result = transformPageD3Data('/page-a', singlePageMetadata)
    expect(result.nodes.length).toBeGreaterThanOrEqual(1)
    const centerNode = result.nodes.find((n) => n.id === '/page-a')
    expect(centerNode).toBeDefined()
    expect(centerNode?.type).toBe('page')
  })

  it('creates outgoing link nodes', () => {
    const result = transformPageD3Data('/page-a', singlePageMetadata)
    const targetNode = result.nodes.find((n) => n.id === '/page-b')
    expect(targetNode).toBeDefined()
  })

  it('creates links from current page to outgoing targets', () => {
    const result = transformPageD3Data('/page-a', singlePageMetadata)
    expect(result.links.length).toBe(1)
    expect(result.links[0].source).toBe('/page-a')
    expect(result.links[0].target).toBe('/page-b')
  })

  it('does not create page graph nodes or links for missing wiki targets', () => {
    const metadata: SiteMetadata = {
      '/page-a': {
        outgoingLinks: [
          {
            text: 'Missing Wiki',
            relativePath: '/missing-wiki',
            fullUrl: '/missing-wiki',
            type: 'wiki',
            raw: '[[Missing Wiki]]'
          }
        ],
        backLinks: [],
        wordCount: 100,
        firstHeading: 'Page A',
        lastUpdated: 1000
      }
    }

    const result = transformPageD3Data('/page-a', metadata)

    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].outDegree).toBe(0)
    expect(result.nodes.find((node) => node.id === '/missing-wiki')).toBe(
      undefined
    )
    expect(result.links).toHaveLength(0)
  })

  it('creates back link nodes and links', () => {
    const result = transformPageD3Data('/page-b', twoPageMetadata)
    const backLinkNode = result.nodes.find((n) => n.id === '/page-a')
    expect(backLinkNode).toBeDefined()

    const backLink = result.links.find(
      (l) => l.source === '/page-a' && l.target === '/page-b'
    )
    expect(backLink).toBeDefined()
  })

  it('includes inDegree and outDegree on center node', () => {
    const result = transformPageD3Data('/page-a', singlePageMetadata)
    const center = result.nodes.find((n) => n.id === '/page-a')
    expect(center?.outDegree).toBe(1)
  })

  it('does not duplicate nodes when same path appears in both outgoing and backlinks', () => {
    // Create metadata where page-a links to page-b, and page-b also has page-a as backlink
    const metadata: SiteMetadata = {
      '/page-a': {
        outgoingLinks: [
          {
            text: 'B',
            relativePath: '/page-b',
            fullUrl: '/page-b',
            type: 'markdown',
            raw: '/page-b'
          }
        ],
        backLinks: [
          {
            text: 'B', // Same page also as backlink
            relativePath: '/page-b',
            fullUrl: '/page-b',
            type: 'markdown',
            raw: '/page-b'
          }
        ],
        wordCount: 100,
        firstHeading: 'A',
        lastUpdated: 1000
      }
    }
    const result = transformPageD3Data('/page-a', metadata)
    // /page-b should only appear once
    const pageBNodes = result.nodes.filter((n) => n.id === '/page-b')
    expect(pageBNodes.length).toBe(1)
  })

  it('handles page with no outgoing or back links', () => {
    const metadata: SiteMetadata = {
      '/isolated': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'Isolated',
        lastUpdated: 500
      }
    }
    const result = transformPageD3Data('/isolated', metadata)
    expect(result.nodes).toHaveLength(1)
    expect(result.links).toHaveLength(0)
  })

  it('handles page with undefined outgoingLinks and backLinks', () => {
    const metadata: SiteMetadata = {
      '/no-links': {
        outgoingLinks: undefined as unknown as any[],
        backLinks: undefined as unknown as any[],
        wordCount: 5,
        firstHeading: 'No Links',
        lastUpdated: 100
      }
    }
    const result = transformPageD3Data('/no-links', metadata)
    expect(result.nodes).toHaveLength(1)
    expect(result.links).toHaveLength(0)
  })

  it('page with outgoingLinks undefined creates center node only', () => {
    const metadata: SiteMetadata = {
      '/only-page': {
        outgoingLinks: undefined as unknown as any[],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Only',
        lastUpdated: 1
      }
    }
    const result = transformPageD3Data('/only-page', metadata)
    expect(result.nodes).toHaveLength(1)
    expect(result.links).toHaveLength(0)
  })

  it('page with backLinks undefined creates center node plus outgoing', () => {
    const metadata: SiteMetadata = {
      '/has-outgoing': {
        outgoingLinks: [
          {
            text: 'Other',
            relativePath: '/other',
            fullUrl: '/other',
            type: 'markdown',
            raw: '/other'
          }
        ],
        backLinks: undefined as unknown as any[],
        wordCount: 1,
        firstHeading: 'Has Outgoing',
        lastUpdated: 1
      }
    }
    const result = transformPageD3Data('/has-outgoing', metadata)
    expect(result.nodes.length).toBeGreaterThan(1)
    expect(result.links.length).toBe(1)
  })
})

describe('transformSiteD3Data', () => {
  it('returns empty structure for empty metadata', () => {
    const result = transformSiteD3Data(emptyMetadata)
    expect(result.nodes).toEqual([])
    expect(result.links).toEqual([])
  })

  it('creates nodes for all pages in metadata', () => {
    const result = transformSiteD3Data(twoPageMetadata)
    expect(result.nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('creates links for outgoing connections', () => {
    const result = transformSiteD3Data(twoPageMetadata)
    expect(result.links.length).toBeGreaterThanOrEqual(1)
    const link = result.links.find(
      (l) => l.source === 'page-a' && l.target === 'page-b'
    )
    expect(link).toBeDefined()
  })

  it('normalizes node IDs by removing leading/trailing slashes', () => {
    const result = transformSiteD3Data(twoPageMetadata)
    const nodeA = result.nodes.find((n) => n.id === 'page-a')
    const nodeB = result.nodes.find((n) => n.id === 'page-b')
    expect(nodeA).toBeDefined()
    expect(nodeB).toBeDefined()
  })

  it('computes inDegree for linked nodes', () => {
    const result = transformSiteD3Data(twoPageMetadata)
    const nodeB = result.nodes.find((n) => n.id === 'page-b')
    // page-b is linked from page-a, so inDegree should be >= 1
    expect(nodeB?.inDegree).toBeGreaterThanOrEqual(1)
  })

  it('computes outDegree for source nodes', () => {
    const result = transformSiteD3Data(twoPageMetadata)
    const nodeA = result.nodes.find((n) => n.id === 'page-a')
    // page-a has 1 outgoing link
    expect(nodeA?.outDegree).toBeGreaterThanOrEqual(1)
  })

  it('merges duplicate node references across different pages outgoing links', () => {
    const metadata: SiteMetadata = {
      '/page-a': {
        outgoingLinks: [
          {
            text: 'Common',
            relativePath: '/common',
            fullUrl: '/common',
            type: 'markdown',
            raw: '/common'
          }
        ],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'A',
        lastUpdated: 100
      },
      '/page-b': {
        outgoingLinks: [
          {
            text: 'Common',
            relativePath: '/common',
            fullUrl: '/common',
            type: 'markdown',
            raw: '/common'
          }
        ],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'B',
        lastUpdated: 200
      }
    }
    const result = transformSiteD3Data(metadata)
    const commonNodes = result.nodes.filter((n) => n.id === 'common')
    expect(commonNodes.length).toBe(1)
    // inDegree should be 2 (linked from both page-a and page-b)
    expect(commonNodes[0].inDegree).toBe(2)
  })

  it('handles wiki-type nodes', () => {
    const metadata: SiteMetadata = {
      '/main': {
        outgoingLinks: [
          {
            text: 'Wiki Page',
            relativePath: '/wiki-page',
            fullUrl: '/wiki-page',
            type: 'wiki',
            raw: '/wiki-page'
          }
        ],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'Main',
        lastUpdated: 100
      },
      '/wiki-page': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'Wiki Page',
        lastUpdated: 100
      }
    }
    const result = transformSiteD3Data(metadata)
    const wikiNode = result.nodes.find((n) => n.id === 'wiki-page')
    expect(wikiNode).toBeDefined()
    expect(wikiNode?.type).toBe('wiki')
  })

  it('does not create site graph nodes or links for missing wiki targets', () => {
    const metadata: SiteMetadata = {
      '/main': {
        outgoingLinks: [
          {
            text: 'Missing Wiki',
            relativePath: '/missing-wiki',
            fullUrl: '/missing-wiki',
            type: 'wiki',
            raw: '[[Missing Wiki]]'
          }
        ],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'Main',
        lastUpdated: 100
      }
    }

    const result = transformSiteD3Data(metadata)

    expect(result.nodes.find((node) => node.id === 'missing-wiki')).toBe(
      undefined
    )
    expect(
      result.links.find((link) => link.target === 'missing-wiki')
    ).toBeUndefined()
  })

  it('normalizes paths with multiple slashes', () => {
    const metadata: SiteMetadata = {
      '/a//b': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Slashed',
        lastUpdated: 1
      }
    }
    const result = transformSiteD3Data(metadata)
    const node = result.nodes.find((n) => n.id === 'a/b')
    expect(node).toBeDefined()
  })

  it('normalizes paths with trailing slashes', () => {
    const metadata: SiteMetadata = {
      '/trailing/': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Trailing',
        lastUpdated: 1
      }
    }
    const result = transformSiteD3Data(metadata)
    const node = result.nodes.find((n) => n.id === 'trailing')
    expect(node).toBeDefined()
  })

  it('handles empty text in link by falling back to path basename', () => {
    const metadata: SiteMetadata = {
      '/source': {
        outgoingLinks: [
          {
            text: '',
            relativePath: '/target-page',
            fullUrl: '/target-page',
            type: 'markdown',
            raw: '/target-page'
          }
        ],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Source',
        lastUpdated: 1
      }
    }
    const result = transformSiteD3Data(metadata)
    const targetNode = result.nodes.find((n) => n.id === 'target-page')
    expect(targetNode).toBeDefined()
    expect(targetNode?.name).toBe('target-page')
  })

  it('falls back to full path when both text and basename are empty', () => {
    const metadata: SiteMetadata = {
      '/a/b/': {
        outgoingLinks: [
          {
            text: '',
            relativePath: '//',
            fullUrl: '/',
            type: 'markdown',
            raw: '/'
          }
        ],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Source',
        lastUpdated: 1
      }
    }
    const result = transformSiteD3Data(metadata)
    const node = result.nodes.find((n) => n.id === '')
    expect(node).toBeDefined()
  })

  it('transforms page data with duplicate outgoing link paths', () => {
    const metadata: SiteMetadata = {
      '/dup': {
        outgoingLinks: [
          {
            text: 'Same',
            relativePath: '/same',
            fullUrl: '/same',
            type: 'markdown',
            raw: '/same'
          },
          {
            text: 'Same Again',
            relativePath: '/same',
            fullUrl: '/same',
            type: 'markdown',
            raw: '/same'
          }
        ],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Dup',
        lastUpdated: 1
      }
    }
    const result = transformPageD3Data('/dup', metadata)
    const sameNodes = result.nodes.filter((n) => n.id === '/same')
    expect(sameNodes.length).toBe(1)
    expect(result.links.length).toBe(2)
  })

  it('fullUrl starts with / for page nodes in transformSiteD3Data', () => {
    const metadata: SiteMetadata = {
      'page-x': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 10,
        firstHeading: 'Page X',
        lastUpdated: 100
      }
    }
    const result = transformSiteD3Data(metadata)
    const pageNode = result.nodes.find((n) => n.id === 'page-x')
    expect(pageNode).toBeDefined()
    expect(pageNode?.fullUrl).toBe('/page-x')
  })

  it('fullUrl starts with / for link nodes in transformSiteD3Data', () => {
    const metadata: SiteMetadata = {
      source: {
        outgoingLinks: [
          {
            text: 'Target',
            relativePath: 'target',
            fullUrl: '/target',
            type: 'markdown',
            raw: '/target'
          }
        ],
        backLinks: [],
        wordCount: 1,
        firstHeading: 'Source',
        lastUpdated: 1
      }
    }
    const result = transformSiteD3Data(metadata)
    const linkNode = result.nodes.find((n) => n.id === 'target')
    expect(linkNode).toBeDefined()
    expect(linkNode?.fullUrl).toBe('/target')
  })

  it('fullUrl starts with / for current page node in transformPageD3Data', () => {
    const metadata: SiteMetadata = {
      'the-page': {
        outgoingLinks: [],
        backLinks: [],
        wordCount: 5,
        firstHeading: 'The Page',
        lastUpdated: 1
      }
    }
    const result = transformPageD3Data('the-page', metadata)
    const centerNode = result.nodes.find((n) => n.id === 'the-page')
    expect(centerNode).toBeDefined()
    expect(centerNode?.fullUrl).toBe('/the-page')
  })

  it('handles backlink pointing to a path already in nodesMap from outgoingLinks', () => {
    const metadata: SiteMetadata = {
      '/center': {
        outgoingLinks: [
          {
            text: 'Shared',
            relativePath: '/shared',
            fullUrl: '/shared',
            type: 'markdown',
            raw: '/shared'
          }
        ],
        backLinks: [
          {
            text: 'Shared Back',
            relativePath: '/shared',
            fullUrl: '/shared',
            type: 'markdown',
            raw: '/shared'
          }
        ],
        wordCount: 1,
        firstHeading: 'Center',
        lastUpdated: 1
      }
    }
    const result = transformPageD3Data('/center', metadata)
    const sharedNodes = result.nodes.filter((n) => n.id === '/shared')
    expect(sharedNodes.length).toBe(1)
    expect(result.links.length).toBe(2)
  })
})
