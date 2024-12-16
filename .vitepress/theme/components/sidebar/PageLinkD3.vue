<template>
  <div
    class="d3-force-sidebar-container w-48 h-48 border border-gray-800 mt-16"
  >
    <D3ForceGraph
      :nodes="graphData.nodes"
      :links="graphData.links"
      :width="320"
      :height="320"
      :diameter="6"
      :text-size="18"
      circle-color="#bb0cf6"
      text-color="#0b0503"
    />
  </div>
</template>

<script lang="ts" setup>
  import D3ForceGraph from '@/theme/components/common/D3ForceGraph.vue'
  import { transformPageD3Data } from '@/theme/utils/themeUtils'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute } from 'vitepress'
  import { computed } from 'vue'

  const route = useRoute()
  const currentPath = computed(() =>
    route.data.relativePath.replace(/\.md$/, '')
  )
  const currentPageLinks = computed(
    () => globalMdMetadata[currentPath.value]?.innerLinks || []
  )
  const graphData = computed(() =>
    transformPageD3Data(currentPageLinks.value, currentPath.value)
  )

  // For debugging
  // watch(currentPath, (newPath) => {
  //   console.log('Path changed:', newPath)
  //   console.log('Links:', currentPageLinks.value)
  //   console.log('Graph data:', graphData.value)
  // })
</script>
