<template>
  <div class="d3-overall-container">
    <D3ForceGraph
      v-model="zoomLevel"
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="props.width"
      :height="props.height"
      :link-strength=0.12
      :link-distance=30
      :charge-strength=-700
      :diameter=9
      :text-size=16
      :circle-color="`var(--vp-c-brand)`"
      :text-color="`var(--vp-c-text)`"
    />
  </div>
</template>

<script lang="ts" setup>
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { computed, ref } from 'vue'

  import { transformSiteD3Data } from '../../utils/client/'
  import D3ForceGraph from './D3ForceGraph.vue'

  const zoomLevel = ref(0.6)
  const props = withDefaults(
    defineProps<{
      width?: number
      height?: number
    }>(),
    {
      width: 960,
      height: 960
    }
  )

  const graphData = computed(() => transformSiteD3Data(siteMetadata))
</script>

<style scoped>
  .d3-overall-container {
    @apply h-full w-full;
  }
</style>
