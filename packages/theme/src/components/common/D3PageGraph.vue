<template>
  <div class="d3-page-container">
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
    />
  </div>
</template>

<script lang="ts" setup>
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { useRoute } from 'vitepress'
  import { computed, ref } from 'vue'

  import { transformPageD3Data } from '../../utils/client/'
  import D3ForceGraph from './D3ForceGraph.vue'

  const props = withDefaults(
    defineProps<{
      width?: number
      height?: number
      diameter?: number
      textSize?: number
      circleColor?: string
      textColor?: string
    }>(),
    {
      width: 320,
      height: 320,
      diameter: 6,
      textSize: 18,
      circleColor: '#8b3cf6',
      textColor: '#0b0503'
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
</script>

<style scoped>
  .d3-page-container {
    @apply w-full h-full relative;
  }

  .zoom-display {
    @apply absolute top-2 right-2 px-2 py-1 text-xs;
    @apply text-gray-600/50;
    @apply bg-white rounded;
    @apply backdrop-blur-md;
  }
</style>
