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
  import { useData } from 'vitepress'
  import { ref, watch } from 'vue'

  import IconToggleButton from '../common/IconToggleButton.vue'
  import BlogCardPagination from './BlogCardPagination.vue'
  import BlogListPagination from './BlogListPagination.vue'

  type PageType = 'cardType' | 'ListType'

  const { theme } = useData()
  const configDefaultMode: PageType =
    theme.value.defaultViewMode === 'list' ? 'ListType' : 'cardType'

  const storedViewType = useLocalStorage<PageType>(
    'vp-blog-view-type',
    configDefaultMode
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
    @apply mx-auto flex w-full flex-col px-3;
    @apply md:w-[min(100%,80vw)];
    @apply md:-pb-4 pt-5 pb-3 md:pt-7;
    min-height: calc(100vh - var(--vp-nav-height) - 3rem);
  }

  .pagination-header {
    @apply position-relative mx-auto mt-0 flex shrink-0;
    @apply w-full max-w-[min(96rem,calc(100%-1.5rem))] px-3 pb-1;
  }
</style>

<style>
  /* Override VPDoc max-width so both card and list views can expand */
  .VPDoc:not(.has-sidebar):has(.blog-main) .content {
    max-width: min(1280px, 100%);
    padding-bottom: 0;
  }

  .VPDoc:not(.has-sidebar):has(.blog-main) .content-container {
    max-width: none;
  }

  .VPDoc:not(.has-sidebar):has(.blog-main) .container {
    max-width: min(100%, 100vw - 32px);
  }

  @media (min-width: 768px) {
    .VPDoc:not(.has-sidebar):has(.blog-main) .container {
      max-width: 85%;
    }
  }
</style>
