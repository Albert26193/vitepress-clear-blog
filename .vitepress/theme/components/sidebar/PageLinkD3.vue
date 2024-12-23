<template>
  <div class="mt-16">
    <div class="flex space-x-2">
      <button
        class="border border-solid px-3 py-1 rounded hover:bg-gray-100"
        @click="popupOverview"
      >
        overview
      </button>
      <button
        class="border border-solid px-3 py-1 rounded hover:bg-gray-100"
        @click="expandGraph"
      >
        expand
      </button>
    </div>
    <div class="d3-force-sidebar-container mt-4" v-if="true">
      <D3PageGraph
        :width="320"
        :height="320"
        :circle-color="'#3b3cf6'"
        :text-color="'#4b4543'"
      />
    </div>
  </div>

  <!-- Overview popup -->
  <PopupContainer :show="showOverview" @close="closeOverview">
    <OverallD3 />
  </PopupContainer>

  <!-- Expand popup -->
  <PopupContainer :show="showExpand" @close="closeExpand">
    <D3PageGraph
      :width="960"
      :height="1060"
      :circle-color="'#fc8ca6'"
      :text-color="'#4b4543'"
    />
  </PopupContainer>
</template>

<script setup lang="ts">
  import D3PageGraph from '@/theme/components/common/D3PageGraph.vue'
  import OverallD3 from '@/theme/components/common/OverallD3.vue'
  import PopupContainer from '@/theme/components/common/PopupContainer.vue'
  import { transformPageD3Data } from '@/theme/utils/themeUtils'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute } from 'vitepress'
  import { computed, ref, watch } from 'vue'

  const route = useRoute()
  const currentPath = computed(() =>
    route.data.relativePath.replace(/\.md$/, '')
  )

  const graphData = computed(() =>
    transformPageD3Data(currentPath.value, globalMdMetadata)
  )

  console.log('nodes for graph', graphData.value)

  // Popup state management
  const showOverview = ref(false)
  const showExpand = ref(false)

  // Watch route changes to reset popup state
  watch(
    () => route.path,
    () => {
      showOverview.value = false
      showExpand.value = false
    }
  )

  const popupOverview = () => {
    showOverview.value = true
  }

  const closeOverview = () => {
    showOverview.value = false
  }

  const expandGraph = () => {
    showExpand.value = true
  }

  const closeExpand = () => {
    showExpand.value = false
  }
</script>

<style scoped>
  .d3-force-sidebar-container {
    @apply w-full h-full border border-solid border-gray-500;
    @apply hover:shadow-lg transition-shadow duration-300;
  }
</style>
