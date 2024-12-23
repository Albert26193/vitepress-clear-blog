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
  import { useRouter } from 'vitepress'
  import { onMounted, ref, watch } from 'vue'

  const router = useRouter()
  const svgRef = ref<SVGSVGElement | null>(null)

  const props = withDefaults(defineProps<D3ForceConfig>(), {
    width: 320,
    height: 320,
    diameter: 10,
    textSize: 5,
    circleColor: '#5040c9',
    textColor: '#4a4a4a'
  })

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
          .distance(90)
          .strength(0.1)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .force('cluster', forceCluster())

    // Add cluster force function
    function forceCluster() {
      const strength = 0.05
      const centerX = width / 2
      const centerY = height / 2
      const force = (alpha: number) => {
        for (const d of nodes) {
          const group = d.group ?? 2
          const k = alpha * strength
          const groupCenterX = centerX + (group * 100 - 200)
          const groupCenterY = centerY
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

      // 开始拖拽时就启动模拟
      if (!event.active) simulation.alphaTarget(0.3).restart()
    }

    const dragged = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      const dx = event.x - dragStartPosition.x
      const dy = event.y - dragStartPosition.y
      const dragDistance = Math.sqrt(dx * dx + dy * dy)

      if (!isDragging && dragDistance > 0) {
        // 第一次判定为拖拽时，从节点当前位置开始
        isDragging = true
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      if (isDragging) {
        // 之后使用相对位移来更新位置
        event.subject.fx = event.x + dx / 1000
        event.subject.fy = event.y + dy / 1000
      }
    }

    const dragEnded = (event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) => {
      if (!isDragging) {
        // 如果没有拖拽，这是一个点击事件
        handleNodeClick(event.subject)
      }

      // 重置状态
      isDragging = false
      draggedNode = null

      // 释放节点，让它可以继续移动
      event.subject.fx = null
      event.subject.fy = null

      // 逐渐停止模拟
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
