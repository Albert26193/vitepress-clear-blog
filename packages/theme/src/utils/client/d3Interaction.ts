import * as d3Type from 'd3'

import type { D3Link, D3Node } from '../../types/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZoomConfig {
  /** Zoom range [min, max]. Default [0.1, 2.0]. */
  scaleExtent?: [number, number]
  /** Pixel bounds that the viewport must stay within. Default [[0,0],[w,h]]. */
  translateExtent?: [[number, number], [number, number]]
  /** Initial zoom scale applied after the behavior is bound. Default 1. */
  initialScale?: number
}

export interface DragConfig {
  /** Simulation alpha target while dragging. Default 0.3. */
  alphaTarget?: number
}

// ---------------------------------------------------------------------------
// Node highlight
// ---------------------------------------------------------------------------

/**
 * Updates visual highlight and dim states on nodes and links relative to a
 * focused node. Pass `null` to reset every element to its default appearance.
 */
export function updateNodeHighlight(
  node: d3Type.Selection<SVGGElement, D3Node, SVGGElement, unknown>,
  link: d3Type.Selection<SVGLineElement, D3Link, SVGGElement, unknown>,
  focused: D3Node | null,
  textSize: number
): void {
  if (!focused) {
    node
      .classed('d3-force-node-highlight', false)
      .classed('d3-force-node-dim', false)
      .classed('d3-force-node-active', false)
      .each(function () {
        d3Type.select(this).select('text').style('font-size', `${textSize}px`)
      })
    link
      .classed('d3-force-link-highlight', false)
      .classed('d3-force-link-dim', false)
    return
  }

  const connected = new Set<D3Node>()
  link.each((l) => {
    if (l.source === focused) connected.add(l.target as D3Node)
    if (l.target === focused) connected.add(l.source as D3Node)
  })

  node
    .classed(
      'd3-force-node-highlight',
      (n) => n === focused || connected.has(n)
    )
    .classed('d3-force-node-active', (n) => n === focused)
    .classed('d3-force-node-dim', (n) => n !== focused && !connected.has(n))
    .each(function (n) {
      d3Type
        .select(this)
        .select('text')
        .style('font-size', n === focused ? '1.4rem' : `${textSize}px`)
    })

  link
    .classed(
      'd3-force-link-highlight',
      (l) => l.source === focused || l.target === focused
    )
    .classed(
      'd3-force-link-dim',
      (l) => l.source !== focused && l.target !== focused
    )
}

// ---------------------------------------------------------------------------
// Zoom
// ---------------------------------------------------------------------------

/**
 * Creates and binds a d3-zoom behavior to the SVG element.
 *
 * Returns the zoom behavior so callers can programmatically set the initial
 * transform with {@link applyInitialZoom}.
 */
export function createZoom(
  svg: d3Type.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3Type.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  config: ZoomConfig,
  onZoom?: (scale: number) => void
): d3Type.ZoomBehavior<SVGSVGElement, unknown> {
  const {
    scaleExtent = [0.1, 2.0],
    translateExtent = [
      [0, 0],
      [width, height]
    ],
    initialScale = 1
  } = config

  const zoom = d3Type
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent(scaleExtent)
    .translateExtent(translateExtent)
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
      onZoom?.(event.transform.k)
    })

  svg.call(zoom)

  // Apply initial zoom with center positioning
  const tx = (width * (1 - initialScale)) / 2
  const ty = (height * (1 - initialScale)) / 2
  svg.call(
    zoom.transform,
    d3Type.zoomIdentity.translate(tx, ty).scale(initialScale)
  )

  return zoom
}

// ---------------------------------------------------------------------------
// Drag + Click
// ---------------------------------------------------------------------------

/**
 * Binds d3-drag with integrated click detection to a node selection.
 *
 * A drag that stays within the same pixel position is treated as a click.
 * Highlight state is updated at the start and end of every interaction.
 */
export function createDrag(
  node: d3Type.Selection<SVGGElement, D3Node, SVGGElement, unknown>,
  link: d3Type.Selection<SVGLineElement, D3Link, SVGGElement, unknown>,
  simulation: d3Type.Simulation<D3Node, D3Link>,
  textSize: number,
  config: DragConfig,
  onNodeClick?: (d: D3Node) => void
): void {
  let isDragging = false
  let startPos = { x: 0, y: 0 }

  const dragStarted = (
    event: d3Type.D3DragEvent<SVGGElement, D3Node, D3Node>
  ) => {
    event.sourceEvent.stopPropagation()
    startPos = { x: event.x, y: event.y }
    isDragging = false
    updateNodeHighlight(node, link, event.subject, textSize)
    if (!event.active)
      simulation.alphaTarget(config.alphaTarget ?? 0.3).restart()
  }

  const dragged = (event: d3Type.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
    const dx = event.x - startPos.x
    const dy = event.y - startPos.y
    if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 0) {
      isDragging = true
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }
    if (isDragging) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }
  }

  const dragEnded = (
    event: d3Type.D3DragEvent<SVGGElement, D3Node, D3Node>
  ) => {
    if (!isDragging) {
      onNodeClick?.(event.subject)
    }
    isDragging = false
    event.subject.fx = null
    event.subject.fy = null
    simulation.alphaTarget(0)
    updateNodeHighlight(node, link, null, textSize)
  }

  node.call(
    d3Type
      .drag<SVGGElement, D3Node>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
  )
}

// ---------------------------------------------------------------------------
// Hover
// ---------------------------------------------------------------------------

/**
 * Binds mouseover / mouseout handlers to a node selection so that connected
 * nodes and links are highlighted while the pointer rests on a node.
 */
export function createHover(
  node: d3Type.Selection<SVGGElement, D3Node, SVGGElement, unknown>,
  link: d3Type.Selection<SVGLineElement, D3Link, SVGGElement, unknown>,
  textSize: number
): void {
  node
    .on('mouseover', (_event, d) => {
      updateNodeHighlight(node, link, d, textSize)
    })
    .on('mouseout', () => {
      updateNodeHighlight(node, link, null, textSize)
    })
}
