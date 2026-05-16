<template>
  <div class="d3-force-container">
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
            strokeOpacity: 0.5,
            strokeWidth: '0.5px'
          }"
        ></line>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
  import * as d3 from 'd3'
  import debounce from 'lodash/debounce'
  import { useRouter, withBase } from 'vitepress'
  import { onMounted, ref, watch } from 'vue'

  import type { D3ForceConfig, D3Link, D3Node } from '../../types/types'
  import {
    createDrag,
    createHover,
    createZoom,
    updateNodeHighlight
  } from '../../utils/client/d3Interaction'
  import { calculateNodeRatios } from '../../utils/client/d3Utils'

  const router = useRouter()
  const svgRef = ref<SVGSVGElement | null>(null)

  interface Props extends D3ForceConfig {
    /** Current zoom level mirrored through v-model for external controls. */
    modelValue?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 320,
    height: 320,
    diameter: 10,
    textSize: 5,
    circleColor: '#5040c9',
    textColor: '#4a4a4a',
    modelValue: 1,
    linkDistance: 40,
    linkStrength: 0.12,
    linkColor: '#0e0e0e',
    chargeStrength: -600
  })

  const emit = defineEmits<{
    /**
     * Keeps external zoom displays synchronized with D3 zoom behavior.
     *
     * @param e - Vue model update event name.
     * @param value - Current D3 zoom scale.
     */
    (e: 'update:modelValue', value: number): void
  }>()

  const debouncedEmit = debounce((value: number) => {
    emit('update:modelValue', value)
  }, 100)

  // Create a function to initialize or update the graph
  const initializeGraph = () => {
    if (!svgRef.value) return

    // Clear existing content
    d3.select(svgRef.value).selectAll('*').remove()

    const { nodes, links, width, height } = props
    const ratioMap = calculateNodeRatios(nodes, links, {
      minRatio: 1,
      maxRatio: 2
    })
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(props.linkDistance)
          .strength(props.linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(props.chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('cluster', forceCluster())

    // Add cluster force function
    function forceCluster() {
      // Significantly increase the clustering strength
      const strength = 0.07
      const centerX = width / 2
      const centerY = height / 2

      const force = (alpha: number) => {
        for (const d of nodes) {
          const group = d.group ?? 0
          const k = alpha * strength

          // Increase the distance between group centers
          const groupCenterX = centerX + (group * 300 - 400)
          const groupCenterY = centerY

          // Apply stronger attraction to group centers
          d.vx! += (groupCenterX - d.x!) * k
          d.vy! += (groupCenterY - d.y!) * k
        }
      }
      return force
    }

    // Get the actual width of the container
    const containerWidth = svgRef.value.parentElement?.clientWidth || 200
    svgRef.value.setAttribute('width', containerWidth.toString())

    // Create SVG and root group
    const svg = d3
      .select(svgRef.value)
      .attr('width', width)
      .attr('height', height)
      .attr(
        'style',
        'max-width: 100%; height: auto; display: block; margin: auto;'
      )
      .attr('viewBox', [0, 0, width, height])

    const g = svg.append('g')

    // Zoom behavior extracted to d3Interaction
    createZoom(svg, g, width, height, { initialScale: props.modelValue }, (s) =>
      debouncedEmit(s)
    )

    // create links
    const link = g
      .selectAll('.d3-force-link')
      .data(links)
      .join('line')
      .attr('class', 'd3-force-link')
      .attr('stroke', props.linkColor)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.8)

    // crate nodes
    const node = g
      .selectAll<SVGGElement, D3Node>('.d3-force-node')
      .data(nodes)
      .join('g')
      .attr('class', 'd3-force-node')
      .style('cursor', 'pointer')

    // add node circles
    node
      .append('circle')
      .attr('r', (d) => (ratioMap.get(d.id) || 1) * props.diameter)
      .attr('fill', (d) => d.color || props.circleColor)

    // add node texts with background for better readability
    // First, add the text background rectangle
    node
      .append('rect')
      .attr('class', 'text-background')
      .attr('fill', 'var(--vp-sidebar-bg-color)')
      .attr('opacity', 0.95)
      .attr('rx', 3) // rounded rectangle
      .attr('ry', 3)
      .attr('width', 0) // initial width is 0, will be updated later
      .attr('height', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('border', '1px solid black')

    // Then add the text
    node
      .append('text')
      .attr('dy', (d) => (ratioMap.get(d.id) || 1) * props.diameter + 19)
      .attr('text-anchor', 'middle')
      .attr('fill', props.textColor)
      .style('font-size', `${props.textSize}px`)
      .style('opacity', 0.95)
      .style('font-weight', '500')
      .text((d) => d.name || 'demo')

    // Update the background rectangle's size to match the text
    node.each(function (d: D3Node) {
      const nodeElement = d3.select(this)
      const textElement = nodeElement.select('text').node() as SVGTextElement
      if (textElement) {
        const textWidth = textElement.getComputedTextLength()
        const textHeight = props.textSize * 1.2

        // Update the background rectangle's size and position
        nodeElement
          .select('rect.text-background')
          .attr('width', textWidth + 16) // text width plus some padding
          .attr('height', textHeight + 6) // add some vertical padding
          .attr('x', -textWidth / 2 - 8) // center horizontally
          .attr(
            'y',
            (ratioMap.get(d.id) || 1) * props.diameter + 15 - textHeight / 2 - 2
          ) // center vertically
      }
    })

    // Modify the collision detection to consider the text size
    // TODO: custom collision detection
    simulation.force(
      'collision',
      d3
        .forceCollide()
        .radius((d) => {
          // Find the corresponding node's text element
          const nodeElement = node
            .filter((n) => n.id === (d as D3Node).id)
            .node()
          if (nodeElement) {
            const textElement = d3
              .select(nodeElement)
              .select('text')
              .node() as SVGTextElement
            if (textElement) {
              const textWidth = textElement.getComputedTextLength()
              // Return a collision radius based on the text width
              return Math.max(props.diameter, textWidth / 2 + 5) // add some padding to text width
            }
          }
          return props.diameter
        })
        .strength(1)
    )

    // Drag + click extracted to d3Interaction
    createDrag(node, link, simulation, props.textSize, {}, (d) => {
      if (d.fullUrl) {
        router.go(withBase(d.fullUrl))
      }
    })

    // Hover extracted to d3Interaction
    createHover(node, link, props.textSize)

    // Start the simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })
  }

  // Watch for changes in nodes or links
  watch(
    () => [props.nodes, props.links],
    () => {
      initializeGraph()
    },
    { deep: true }
  )

  // Watch for changes in linkColor prop to update link colors
  watch(
    () => props.linkColor,
    (newColor) => {
      if (svgRef.value) {
        d3.select(svgRef.value)
          .selectAll('.d3-force-link')
          .attr('stroke', newColor)
      }
    }
  )

  onMounted(() => {
    initializeGraph()
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
    fill: var(--vp-c-text-1);
  }

  :deep(.d3-force-node.d3-force-node-highlight) text {
    font-weight: semi-bold;
  }

  :deep(.d3-force-node.d3-force-node-active) .text-background {
    fill: var(--vp-c-bg);
  }

  :deep(.d3-force-node.d3-force-node-dim) circle {
    opacity: 0.2;
  }

  :deep(.d3-force-node.d3-force-node-dim) text {
    opacity: 0.1;
    fill: #c3c4c6;
  }

  :deep(.d3-force-link.d3-force-link-highlight) {
    stroke: #828282;
    stroke-opacity: 0.8;
    stroke-width: 1.3px;
  }

  :deep(.d3-force-link.d3-force-link-dim) {
    stroke-opacity: 0.2;
  }
</style>
