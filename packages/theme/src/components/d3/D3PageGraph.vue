<template>
  <div class="d3-page-graph-container">
    <div class="zoom-display"> zoom: {{ (zoomLevel * 100).toFixed(0) }}% </div>
    <D3ForceGraph
      v-model="zoomLevel"
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="props.width"
      :height="props.height"
      :diameter="props.diameter"
      :text-size="props.textSize"
      :circle-color="props.circleColor"
      :text-color="props.textColor"
      :link-distance="20"
      :link-color="linkColor"
    />
  </div>
</template>

<script lang="ts" setup>
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { useRoute } from 'vitepress'
  import { computed, ref } from 'vue'

  import { transformPageD3Data } from '../../utils/client'
  import D3ForceGraph from './D3ForceGraph.vue'

  const props = withDefaults(
    defineProps<{
      /** Width reserved for the page graph SVG viewport. */
      width?: number
      /** Height reserved for the page graph SVG viewport. */
      height?: number
      /** Base node diameter before relationship-based scaling. */
      diameter?: number
      /** Label size used to keep sidebar graphs readable. */
      textSize?: number
      /** Default node color when metadata does not provide one. */
      circleColor?: string
      /** Label color aligned with the active color mode. */
      textColor?: string
    }>(),
    {
      width: 320,
      height: 320,
      diameter: 6,
      textSize: 18,
      circleColor: 'var(--vp-c-brand)',
      textColor: 'var(--vp-c-text-1)'
    }
  )

  const route = useRoute()
  const currentPath = computed(() =>
    route.data.relativePath.replace(/\.md$/, '')
  )

  const graphData = computed(() =>
    transformPageD3Data(currentPath.value, siteMetadata)
  )

  const zoomLevel = ref(1)
  const linkColor = 'var(--vp-c-text-1)'
</script>

<style scoped>
  .d3-page-graph-container {
    @apply relative h-full w-full;
  }

  .zoom-display {
    @apply absolute top-0 left-0 z-10 px-1 py-1 text-xs;
    @apply text-[var(--vp-c-text-2)];
    @apply rounded-br bg-[var(--vp-sidebar-bg-color)]/80;
    @apply backdrop-blur-md;
  }
</style>
