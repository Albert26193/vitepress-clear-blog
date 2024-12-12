<template>
  <div
    class="d3-force-sidebar-container w-48 h-48 border border-gray-800 mt-16"
  >
    <D3ForceGraph
      :nodes="nodes"
      :links="links"
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

  const currentPath = useRoute().data.relativePath.replace(/\.md$/, '')
  const currentPageLinks = globalMdMetadata[currentPath]?.innerLinks || []
  const { nodes, links } = transformPageD3Data(currentPageLinks, currentPath)

  console.log(nodes, links, currentPath)
</script>
