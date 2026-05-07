<template>
  <div class="d3-overall-container">
    <D3ForceGraph
      v-model="zoomLevel"
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="props.width"
      :height="props.height"
      :link-strength="0.12"
      :link-distance="30"
      :charge-strength="-700"
      :diameter="9"
      :text-size="16"
      :circle-color="`var(--vp-c-brand)`"
      :text-color="`var(--vp-c-text)`"
      :link-color="linkColor"
    />
  </div>
</template>

<script lang="ts" setup>
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { useData } from 'vitepress'
  import { computed, ref } from 'vue'

  import { transformSiteD3Data } from '../../utils/client'
  import D3ForceGraph from './D3ForceGraph.vue'

  const { isDark } = useData()
  const props = withDefaults(
    defineProps<{
      width?: number
      height?: number
      zoomLevel?: number
    }>(),
    {
      width: 960,
      height: 960,
      zoomLevel: 0.8
    }
  )

  const zoomLevel = ref(props.zoomLevel)

  const graphData = computed(() => transformSiteD3Data(siteMetadata))
  const linkColor = computed(() => {
    return isDark.value ? '#9ca3af' : '#0e0e0e'
  })
</script>

<style scoped>
  .d3-overall-container {
    @apply h-full w-full;
  }
</style>
