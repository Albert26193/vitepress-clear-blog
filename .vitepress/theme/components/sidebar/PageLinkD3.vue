<template>
  <div class="container" style="cursor: pointer">
    <svg ref="svgContainer" :width="width" :height="height">
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
            strokeOpacity: 0.6,
            strokeWidth: '1.5px'
          }"
        ></line>
      </g>
    </svg>
  </div>
</template>

<script lang="ts" setup>
  //TODO: still have serveral problems:
  //1. the nodes are not grouped correctly
  //2. the nodes are not positioned correctly
  //3. the zoom does not work well
  //4. the drag does not work well
  //5. the name of the nodes is not displayed
  import { D3Link, D3Node } from '@/theme/types.d'
  import { transformSiteD3Data } from '@/theme/utils/themeUtils'
  import * as d3 from 'd3'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { onMounted, ref } from 'vue'

  const width = 1600
  const height = 1400
  const svgContainer = ref<SVGSVGElement | null>(null)

  const { nodes, links } = transformSiteD3Data(globalMdMetadata)

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

    function force(alpha: number) {
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
    if (!svgContainer.value) return

    // Get the actual width of the container
    const containerWidth = svgContainer.value.parentElement?.clientWidth || 1200
    svgContainer.value.setAttribute('width', containerWidth.toString())

    const svg = d3.select<SVGSVGElement, unknown>(svgContainer.value)

    // Create a fixed root group element
    const g = svg.append('g')

    // Add zoom functionality
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .extent([
          [0, 0],
          [width, height]
        ])
        .scaleExtent([0.5, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
        })
    )

    const link = g
      .selectAll('.link')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)

    const node = g
      .selectAll<SVGGElement, D3Node>('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(
        drag(simulation) as d3.DragBehavior<
          SVGGElement,
          D3Node,
          D3Node | d3.SubjectPosition
        >
      )

    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => d.color || '#1f77b4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)

    node
      .append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '10px')
      .text((d) => d.name || '')

    // Add hover effects
    node
      .on('mouseover', (event, d) => {
        link
          .attr('stroke', (l) =>
            l.source === d || l.target === d ? '#000' : '#999'
          )
          .attr('stroke-opacity', (l) =>
            l.source === d || l.target === d ? 1 : 0.6
          )

        node.select('circle').attr('stroke-width', (n) => (n === d ? 3 : 1.5))
      })
      .on('mouseout', () => {
        link.attr('stroke', '#999').attr('stroke-opacity', 0.6)

        node.select('circle').attr('stroke-width', 1.5)
      })

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    function drag(simulation: d3.Simulation<D3Node, D3Link>) {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
        const radius = 20
        // Get current zoom transform
        const transform = d3.zoomTransform(svgContainer.value!)

        // Calculate actual mouse position (considering zoom and pan)
        const x = (event.x - transform.x) / transform.k
        const y = (event.y - transform.y) / transform.k

        // Constrain within container bounds
        const containerWidth = svgContainer.value!.clientWidth
        event.subject.fx = Math.max(
          radius,
          Math.min(containerWidth - radius, x)
        )
        event.subject.fy = Math.max(radius, Math.min(height - radius, y))
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3
        .drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }
  })
</script>

<style scoped>
  .container {
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
