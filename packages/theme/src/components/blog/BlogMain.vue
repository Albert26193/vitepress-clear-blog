<template>
  <div class="blog-main">
    <header class="pagination-header">
      <IconToggleButton
        v-model="currentViewType"
        :icons="[
          {
            value: 'ListType',
            iconClass: 'i-carbon-table-of-contents',
            tooltip: 'List View'
          },
          { value: 'cardType', iconClass: 'i-carbon-grid', tooltip: 'Card View' }
        ]"
      />
    </header>

    <BlogCardPagination v-if="currentViewType === 'cardType'" />
    <BlogListPagination v-else-if="currentViewType === 'ListType'" />
  </div>
</template>

<script lang="ts" setup>
  import { useLocalStorage } from '@vueuse/core'
  import { ref, watch } from 'vue'

  import IconToggleButton from '../common/IconToggleButton.vue'
  import BlogCardPagination from './BlogCardPagination.vue'
  import BlogListPagination from './BlogListPagination.vue'

  type PageType = 'cardType' | 'ListType'

  const storedViewType = useLocalStorage<PageType>(
    'vp-blog-view-type',
    'cardType'
  )

  // Use localStorage value directly
  const currentViewType = ref<PageType>(storedViewType.value)

  // Watch for changes and sync with localStorage
  watch(currentViewType, (newValue) => {
    storedViewType.value = newValue
  })
</script>

<style scoped>
  .blog-main {
    @apply w-9/10 mx-auto max-w-6xl;
  }

  .pagination-header {
    @apply position-relative mx-auto max-w-[1280px];
    @apply ml-4 mt-4 flex;
  }
</style>
