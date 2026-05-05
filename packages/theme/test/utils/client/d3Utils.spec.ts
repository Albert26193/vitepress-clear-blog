import { describe, expect, it } from 'vitest'

import type { D3Link, D3Node } from '../../../src/types/types.d'
import { calculateNodeRatios } from '../../../src/utils/client/d3Utils'

function makeNode(id: string | number): D3Node {
  return {
    id,
    inDegree: 0,
    outDegree: 0,
    name: `node-${id}`,
    relativePath: `/path/${id}`,
    fullUrl: `/path/${id}`,
    type: 'page'
  }
}

function makeLink(
  source: string | number | D3Node,
  target: string | number | D3Node
): D3Link {
  return {
    source: typeof source === 'object' ? source.id : source,
    target: typeof target === 'object' ? target.id : target,
    type: 'markdown'
  }
}

describe('calculateNodeRatios', () => {
  it('returns empty map for empty nodes and links', () => {
    const result = calculateNodeRatios([], [])
    expect(result.size).toBe(0)
  })

  it('returns minRatio for isolated nodes (degree 0)', () => {
    const nodes: D3Node[] = [makeNode('a'), makeNode('b')]
    const result = calculateNodeRatios(nodes, [])
    expect(result.size).toBe(2)
    expect(result.get('a')).toBe(1)
    expect(result.get('b')).toBe(1)
  })

  it('calculates ratio for a single link (degree 1 each)', () => {
    const nodes: D3Node[] = [makeNode('a'), makeNode('b')]
    const links: D3Link[] = [makeLink('a', 'b')]
    const result = calculateNodeRatios(nodes, links)
    expect(result.size).toBe(2)
    // degree 1 maps to minRatio (1)
    expect(result.get('a')).toBe(1)
    expect(result.get('b')).toBe(1)
  })

  it('higher degree nodes get higher ratios', () => {
    const a = makeNode('a')
    const b = makeNode('b')
    const c = makeNode('c')
    const nodes = [a, b, c]
    // a connects to b and c (degree 2), b connects to a (degree 1), c connects to a (degree 1)
    const links: D3Link[] = [makeLink('a', 'b'), makeLink('a', 'c')]
    const result = calculateNodeRatios(nodes, links)
    expect(result.get('a')).toBeGreaterThan(result.get('b')!)
    expect(result.get('a')).toBeGreaterThan(result.get('c')!)
  })

  it('respects custom minRatio and maxRatio', () => {
    const nodes: D3Node[] = [makeNode('a')]
    const result = calculateNodeRatios(nodes, [], {
      minRatio: 0.5,
      maxRatio: 3
    })
    // degree 0, clamped to minRatio
    expect(result.get('a')).toBe(0.5)
  })

  it('clamps values outside domain to maxRatio', () => {
    const nodes: D3Node[] = [makeNode('center')]
    // Create many links to the center node
    const extraNodes: D3Node[] = []
    const links: D3Link[] = []
    for (let i = 0; i < 20; i++) {
      const node = makeNode(`n${i}`)
      extraNodes.push(node)
      links.push(makeLink('center', `n${i}`))
    }
    const allNodes = [nodes[0], ...extraNodes]
    const result = calculateNodeRatios(allNodes, links)
    // Center node with degree 20 should be clamped to maxRatio (2)
    expect(result.get('center')).toBe(2)
  })

  it('handles link objects with source/target as objects', () => {
    const a = makeNode('a')
    const b = makeNode('b')
    const nodes: D3Node[] = [a, b]
    const links: D3Link[] = [
      { source: a, target: b, type: 'markdown' },
      { source: b, target: a, type: 'markdown' }
    ]
    const result = calculateNodeRatios(nodes, links)
    expect(result.size).toBe(2)
    expect(result.get('a')).toBe(result.get('b'))
  })

  it('handles numeric node IDs', () => {
    const nodes: D3Node[] = [
      { ...makeNode(1), id: 1 },
      { ...makeNode(2), id: 2 }
    ]
    const links: D3Link[] = [makeLink(1, 2)]
    const result = calculateNodeRatios(nodes, links)
    expect(result.size).toBe(2)
    expect(result.get(1)).toBeDefined()
    expect(result.get(2)).toBeDefined()
  })

  it('ratio is monotonically increasing with degree', () => {
    const nodes: D3Node[] = [makeNode('low'), makeNode('mid'), makeNode('high')]
    const links: D3Link[] = [
      makeLink('low', 'high'),
      makeLink('mid', 'high'),
      makeLink('mid', 'low')
    ]
    const result = calculateNodeRatios(nodes, links)
    // low: degree 1, mid: degree 2, high: degree 2
    expect(result.get('mid')).toBeGreaterThanOrEqual(result.get('low')!)
  })

  it('uses default minRatio=1 maxRatio=2 when options omitted', () => {
    const nodes: D3Node[] = [makeNode('x')]
    const result = calculateNodeRatios(nodes, [])
    expect(result.get('x')).toBe(1)
  })
})
