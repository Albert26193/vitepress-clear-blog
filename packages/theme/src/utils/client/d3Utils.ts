import * as d3 from 'd3'

import type { D3Link, D3Node } from '../../types/types.d'

interface RatioOptions {
  minRatio?: number
  maxRatio?: number
}

export function calculateNodeRatios(
  nodes: D3Node[],
  links: D3Link[],
  options: RatioOptions = {}
): Map<string | number, number> {
  const { minRatio = 1, maxRatio = 2 } = options
  const degreeMap = new Map<string | number, number>()

  // 1. Calculate degree for each node
  nodes.forEach((node) => degreeMap.set(node.id, 0))
  links.forEach((link) => {
    const sourceId =
      typeof link.source === 'object' ? link.source.id : link.source
    const targetId =
      typeof link.target === 'object' ? link.target.id : link.target
    degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1)
    degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1)
  })

  // Define a fixed domain for scaling.
  // A degree of 1 is the baseline.
  // A degree of 10 or more will hit the maximum ratio.
  const domain = [1, 10]

  // 2. Create a power scale function for an accelerating growth curve.
  const ratioScale = d3
    .scalePow()
    .exponent(2) // Use a quadratic scale for acceleration.
    .domain(domain) // Use the fixed domain.
    .range([minRatio, maxRatio]) // Map to the desired ratio range [1, 2].
    .clamp(true) // Clamp values outside the domain to the range boundaries.

  // 3. Map degrees to ratios
  const ratioMap = new Map<string | number, number>()
  degreeMap.forEach((degree, id) => {
    ratioMap.set(id, ratioScale(degree))
  })

  return ratioMap
}
