<template>
  <div class="d3-page-container">
    <div class="flex justify-end">
      <button
        class="-mb-2 mr-2 mt-1 items-center"
        @click="popupOverview"
        :disabled="showOverview || showExpand"
        title="Overview"
      >
        <span
          class="i-carbon-flow text-size-[15px] color-[var(--vp-c-brand)]"
        />
      </button>
      <button
        class="-mb-2 mr-1 mt-1 items-center"
        @click="expandGraph"
        :disabled="showOverview || showExpand"
        title="Expand"
      >
        <span
          class="i-carbon-arrow-up-right text-size-[15px] color-[var(--vp-c-brand)] mr-1"
        />
      </button>
    </div>
    <div class="d3-force-sidebar-container">
      <D3PageGraph
        :width="520"
        :height="500"
        :circle-color="'var(--vp-c-brand)'"
        :text-color="'var(--vp-c-text-1)'"
        :diameter="9"
        :text-size="18"
      />
    </div>
  </div>

  <!-- Overview popup -->
  <PopupContainer :show="showOverview" @close="closeOverview">
    <D3FullScreen :width="width" :height="height" />
  </PopupContainer>

  <!-- Expand popup -->
  <PopupContainer :show="showExpand" @close="closeExpand">
    <D3PageGraph
      :width="width"
      :height="height"
      :circle-color="'var(--vp-c-brand)'"
      :text-color="'var(--vp-c-text-1)'"
      :text-size="18"
    />
  </PopupContainer>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import { useRoute } from 'vitepress'
  import { ref, watch } from 'vue'

  import PopupContainer from '../common/PopupContainer.vue'
  import D3FullScreen from '../d3/D3FullScreen.vue'
  import D3PageGraph from '../d3/D3PageGraph.vue'

  const route = useRoute()
  const { width, height } = useWindowSize()

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
  .d3-page-container {
    @apply border-gray-500 border-1 border-solid;
  }

  .d3-force-sidebar-container {
    @apply h-full w-full;
    @apply transition-shadow duration-300 hover:shadow-md;
  }
</style>
