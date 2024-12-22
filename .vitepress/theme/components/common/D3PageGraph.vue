<template>
  <div class="d3-page-container">
    <D3ForceGraph
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="width"
      :height="height"
      :diameter="diameter"
      :text-size="textSize"
      :circle-color="circleColor"
      :text-color="textColor"
    />
  </div>
</template>

<script lang="ts" setup>
  import D3ForceGraph from '@/theme/components/common/D3ForceGraph.vue'
  import { transformPageD3Data } from '@/theme/utils/themeUtils'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute } from 'vitepress'
  import { computed, defineProps, withDefaults } from 'vue'

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
    transformPageD3Data(currentPath.value, globalMdMetadata)
  )
</script>

<style scoped>
  .d3-page-container {
    @apply w-full h-full;
  }
</style>
