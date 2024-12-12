<template>
  <div class="d3-force-container border border-gray-800 border-solid">
    <svg ref="svgRef" :width="width" :height="height">
      <g>
        <line
          v-for="(link, i) in links"
          :key="i"
          :x1="link.x1"
          :x2="link.x2"
          :y1="link.y1"
          :y2="link.y2"
          :style="{
            stroke: link.color,
            strokeOpacity: 0.8,
            strokeWidth: '1.5px'
          }"
        ></line>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
  import type { D3ForceConfig, D3Link, D3Node } from '@/theme/types.d'
  import * as d3 from 'd3'
  import { onMounted, ref, withDefaults } from 'vue'

  const svgRef = ref<SVGSVGElement | null>(null)

  const props = withDefaults(defineProps<D3ForceConfig>(), {
    width: 320,
    height: 320,
    diameter: 10,
    textSize: 5,
    circleColor: '#5040c9',
    textColor: '#030303'
  })
  console.log('out', props.nodes)
  const { nodes, links, width, height } = props
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink<D3Node, D3Link>(links)
        .id((d) => d.id)
        .distance(80)
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))
    .force('cluster', forceCluster())

  // Add cluster force function
  function forceCluster() {
    const strength = 0.15
    const centerX = width / 2
    const centerY = height / 2
    const force = (alpha: number) => {
      for (const d of nodes) {
        if (d.group) {
          const k = alpha * strength
          const groupCenterX = centerX + (d.group * 200 - 400)
          const groupCenterY = centerY
          d.vx! += (groupCenterX - d.x!) * k
          d.vy! += (groupCenterY - d.y!) * k
        }
      }
    }
    return force
  }

  onMounted(() => {
    if (!svgRef.value) return

    // Get the actual width of the container
    const containerWidth = svgRef.value.parentElement?.clientWidth || 200
    svgRef.value.setAttribute('width', containerWidth.toString())

    // Create the zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    // Select the SVG element and add zoom behavior
    const svg = d3
      .select(svgRef.value)
      .call(zoom)
      .attr('width', width)
      .attr('height', height)
      .attr(
        'style',
        'max-width: 100%; height: auto; display: block; margin: auto;'
      )
      .attr('viewBox', [0, 0, width, height])

    // Create a fixed root group element
    const g = svg.append('g')

    // create links
    const link = g
      .selectAll('.d3-force-link')
      .data(links)
      .join('line')
      .attr('class', 'd3-force-link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)

    // crate nodes
    const node = g
      .selectAll<SVGGElement, D3Node>('.d3-force-node')
      .data(nodes)
      .join('g')
      .attr('class', 'd3-force-node')

    // add node circles
    node
      .append('circle')
      .attr('r', props.diameter)
      .attr('fill', (d) => d.color || props.circleColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)

    // add node texts
    node
      .append('text')
      .attr('dy', props.textSize + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', props.textColor)
      .style('font-size', `${props.textSize}px`)
      .style('opacity', 0.9)
      .style('font-weight', '500')
      .text((d) => d.name || 'demo')

    // Add hover effects
    node
      .on('mouseover', (event, d) => {
        const connectedNodes = new Set()
        // Get all connected nodes
        link.each((l) => {
          if (l.source === d) connectedNodes.add(l.target)
          if (l.target === d) connectedNodes.add(l.source)
        })
        node.classed(
          'd3-force-node-highlight',
          (n) => n === d || connectedNodes.has(n)
        )
        node.classed(
          'd3-force-node-dim',
          (n) => n !== d && !connectedNodes.has(n)
        )
        link.classed(
          'd3-force-link-highlight',
          (l) => l.source === d || l.target === d
        )
        link.classed(
          'd3-force-link-dim',
          (l) => l.source !== d && l.target !== d
        )
      })
      .on('mouseout', () => {
        node
          .classed('d3-force-node-highlight', false)
          .classed('d3-force-node-dim', false)
        link
          .classed('d3-force-link-highlight', false)
          .classed('d3-force-link-dim', false)
      })

    // Add drag functionality
    const dragStarted = (
      event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>
    ) => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }
    const dragged = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }
    const dragEnded = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // Bind drag functions to nodes
    node.call(
      d3
        .drag<SVGGElement, D3Node>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
    )

    // Start the simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })
  })
</script>

<style scoped>
  .d3-force-container {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  :deep(.d3-force-node) circle {
    transition: all 0.3s ease;
  }

  :deep(.d3-force-node) text {
    transition: all 0.3s ease;
  }

  :deep(.d3-force-node.d3-force-node-highlight) circle {
    stroke: #ff4444;
    stroke-width: 3px;
  }

  :deep(.d3-force-node.d3-force-node-highlight) text {
    font-weight: bold;
    font-size: 1.2rem;
  }

  :deep(.d3-force-node.d3-force-node-dim) circle {
    opacity: 0.6;
  }

  :deep(.d3-force-node.d3-force-node-dim) text {
    opacity: 0.6;
  }

  :deep(.d3-force-link) {
    transition: all 0.3s ease;
  }

  :deep(.d3-force-link.d3-force-link-highlight) {
    stroke: #000;
    stroke-opacity: 1;
    stroke-width: 2px;
  }

  :deep(.d3-force-link.d3-force-link-dim) {
    stroke-opacity: 0.3;
  }
</style>
