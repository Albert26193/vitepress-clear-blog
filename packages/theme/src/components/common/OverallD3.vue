<template>
  <div class="d3-overall-container">
    <D3ForceGraph
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="props.width"
      :height="props.height"
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
