<template>
  <div class="d3-overall-container">
    <D3ForceGraph
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="960"
      :height="960"
      :diameter="6"
      :text-size="18"
      circle-color="#8b3cf6"
      text-color="#0b0503"
    />
  </div>
</template>

<script lang="ts" setup>
  import D3ForceGraph from '@/theme/components/common/D3ForceGraph.vue'
  import { transformSiteD3Data } from '@/theme/utils/themeUtils'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { computed } from 'vue'

  const graphData = computed(() => transformSiteD3Data(globalMdMetadata))
</script>

<style scoped>
  .d3-overall-container {
    @apply w-full h-full;
  }
</style>
