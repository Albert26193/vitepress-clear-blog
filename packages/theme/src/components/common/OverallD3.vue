<template>
  <div class="d3-overall-container">
    <D3ForceGraph
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="960"
      :height="960"
      :diameter="9"
      :text-size="15"
      :circle-color="`var(--vp-c-brand)`"
      :text-color="`var(--vp-c-text)`"
    />
  </div>
</template>

<script lang="ts" setup>
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { computed } from 'vue'

  import { transformSiteD3Data } from '../../utils/client/'
  import D3ForceGraph from './D3ForceGraph.vue'

  const graphData = computed(() => transformSiteD3Data(siteMetadata))

  // console.warn('data for overall', JSON.stringify(globalMdMetadata))
  // console.error('nodes for overall', JSON.stringify(graphData.value))
</script>

<style scoped>
  .d3-overall-container {
    @apply h-full w-full;
  }
</style>
