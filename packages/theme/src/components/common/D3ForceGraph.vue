<template>
  <div class="d3-force-container">
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      class="border border-solid"
    >
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
  import lodash from 'lodash'
  import { useRouter } from 'vitepress'
  import { onMounted, ref, watch } from 'vue'

  import type { D3ForceConfig, D3Link, D3Node } from '../../types/types.d'

  const { debounce } = lodash

  const router = useRouter()
  const svgRef = ref<SVGSVGElement | null>(null)

  const props = withDefaults(
    defineProps<
      D3ForceConfig & {
        modelValue?: number
      }
    >(),
    {
      width: 320,
      height: 320,
      diameter: 10,
      textSize: 5,
      circleColor: '#5040c9',
      textColor: '#4a4a4a',
      modelValue: 1
    }
  )

  const emit = defineEmits<{
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
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(50)
          .strength(0.12)
      )
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
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

    // Create the zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 1.6])
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        debouncedEmit(event.transform.k)
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
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.8)

    // crate nodes
    const node = g
      .selectAll<SVGGElement, D3Node>('.d3-force-node')
      .data(nodes)
      .join('g')
      .attr('class', 'd3-force-node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.fullUrl) {
          router.go(d.fullUrl)
          console.log(d.fullUrl)
        }
      })

    // add node circles
    node
      .append('circle')
      .attr('r', props.diameter)
      .attr('fill', (d) => d.color || props.circleColor)

    // add node texts with background for better readability
    // First, add the text background rectangle
    node
      .append('rect')
      .attr('class', 'text-background')
      .attr('fill', 'red')
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
      .attr('dy', props.textSize + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', props.textColor)
      .style('font-size', `${props.textSize}px`)
      .style('opacity', 0.95)
      .style('font-weight', '500')
      .text((d) => d.name || 'demo')

    // Update the background rectangle's size to match the text
    node.each(function () {
      const nodeElement = d3.select(this)
      const textElement = nodeElement.select('text').node() as SVGTextElement
      if (textElement) {
        const textWidth = textElement.getComputedTextLength()
        console.warn(textWidth)
        const textHeight = props.textSize * 1.2

        // Update the background rectangle's size and position
        nodeElement
          .select('rect.text-background')
          .attr('width', textWidth + 10) // text width plus some padding
          .attr('height', textHeight + 4) // add some vertical padding
          .attr('x', -textWidth / 2 - 5) // center horizontally
          .attr('y', props.textSize + 2 - textHeight / 2) // center vertically
      }
    })

    // Modify the collision detection to consider the text size
    // TODO: 自定义碰撞检测
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
              return Math.max(props.diameter, textWidth / 2)
            }
          }
          return props.diameter
        })
        .strength(0.8)
    )

    // Add drag functionality
    let isDragging = false
    let draggedNode: D3Node | null = null
    let dragStartPosition = { x: 0, y: 0 }

    const updateNodeState = (d: D3Node | null) => {
      if (!d) {
        // Reset all states when no node is selected
        node
          .classed('d3-force-node-highlight', false)
          .classed('d3-force-node-dim', false)
        link
          .classed('d3-force-link-highlight', false)
          .classed('d3-force-link-dim', false)
        return
      }
      // Find all connected nodes
      const connectedNodes = new Set()
      link.each((l) => {
        if (l.source === d) connectedNodes.add(l.target)
        if (l.target === d) connectedNodes.add(l.source)
      })
      // Update node states
      node
        .classed(
          'd3-force-node-highlight',
          (n) => n === d || connectedNodes.has(n)
        )
        .classed('d3-force-node-dim', (n) => n !== d && !connectedNodes.has(n))
      // Update link states
      link
        .classed(
          'd3-force-link-highlight',
          (l) => l.source === d || l.target === d
        )
        .classed('d3-force-link-dim', (l) => l.source !== d && l.target !== d)
    }

    const handleNodeClick = (node: D3Node) => {
      if (node.fullUrl) {
        router.go(node.fullUrl)
      }
      updateNodeState(null)
    }

    const dragStarted = (
      event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>
    ) => {
      event.sourceEvent.stopPropagation()
      dragStartPosition = { x: event.x, y: event.y }
      isDragging = false
      draggedNode = event.subject
      updateNodeState(draggedNode)

      // Start the simulation when dragging starts
      if (!event.active) simulation.alphaTarget(0.3).restart()
    }

    const dragged = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      const dx = event.x - dragStartPosition.x
      const dy = event.y - dragStartPosition.y
      const dragDistance = Math.sqrt(dx * dx + dy * dy)

      if (!isDragging && dragDistance > 0) {
        // When dragging starts, start from the node's current position
        isDragging = true
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      if (isDragging) {
        // After that, use relative displacement to update the position
        event.subject.fx = event.x + dx / 1000
        event.subject.fy = event.y + dy / 1000
      }
    }

    const dragEnded = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      if (!isDragging) {
        // If not dragging, it's a click event
        handleNodeClick(event.subject)
      }

      // Reset states
      isDragging = false
      draggedNode = null

      // Release the node to continue moving
      event.subject.fx = null
      event.subject.fy = null

      // Gradually stop the simulation
      simulation.alphaTarget(0)
    }

    // Add hover effects only when not dragging
    node
      .on('mouseover', (event, d) => {
        if (!isDragging) {
          updateNodeState(d)
        }
      })
      .on('mouseout', (event) => {
        if (!isDragging) {
          updateNodeState(null)
        }
      })

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
  }

  // Watch for changes in nodes or links
  watch(
    () => [props.nodes, props.links],
    () => {
      initializeGraph()
    },
    { deep: true }
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
    fill: #030406;
  }

  /* :deep(.d3-force-node.d3-force-node-highlight) circle {
    stroke: #b752ff;
    stroke-width: 2px;
    opacity: 0.2;
  } */

  :deep(.d3-force-node.d3-force-node-highlight) text {
    font-weight: semi-bold;
    font-size: 1.2rem;
    /* opacity: 0.2; */
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
