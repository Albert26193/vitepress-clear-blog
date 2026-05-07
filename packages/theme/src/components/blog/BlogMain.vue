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
          {
            value: 'cardType',
            iconClass: 'i-carbon-grid',
            tooltip: 'Card View'
          }
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
    /* One column stretching to the visible viewport so card grid + pager feel grounded */
    @apply mx-auto flex w-full max-w-[min(96rem,calc(100%-1.5rem))] flex-col px-3;
    /* Breathing room under nav without the old oversized gap */
    @apply pt-5 pb-8 md:pt-7 md:pb-10;
    min-height: calc(100vh - var(--vp-nav-height) - 10rem);
    min-height: calc(100dvh - var(--vp-nav-height) - 10rem);
  }

  .pagination-header {
    @apply position-relative mx-auto mt-0 flex shrink-0;
    @apply w-full max-w-[min(96rem,calc(100%-1.5rem))] px-3 pb-1;
  }
</style>
