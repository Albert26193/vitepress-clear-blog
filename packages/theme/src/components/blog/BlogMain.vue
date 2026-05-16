<template>
  <div ref="blogMainRef" class="blog-main">
    <header class="pagination-header">
      <IconToggleButton
        :model-value="currentViewType"
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
        @update:model-value="handleViewToggle"
      />
    </header>

    <BlogCardPagination v-if="currentViewType === 'cardType'" />
    <BlogListPagination v-else-if="currentViewType === 'ListType'" />
  </div>
</template>

<script lang="ts" setup>
  import { useLocalStorage } from '@vueuse/core'
  import { createTimeline } from 'animejs'
  import { useData } from 'vitepress'
  import { nextTick, ref } from 'vue'

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

  const currentViewType = ref<PageType>(storedViewType.value)
  const blogMainRef = ref<HTMLElement>()

  const handleViewToggle = async (viewType: PageType) => {
    if (viewType === currentViewType.value) return

    const container = blogMainRef.value
    if (!container) {
      currentViewType.value = viewType
      storedViewType.value = viewType
      return
    }

    // Animate out
    const outTimeline = createTimeline([
      {
        targets: container,
        opacity: [1, 0],
        scale: [1, 0.97],
        duration: 150,
        ease: 'out(2)'
      }
    ])

    await outTimeline.then(() => {})

    // Swap view
    currentViewType.value = viewType
    storedViewType.value = viewType
    await nextTick()

    // Animate in
    createTimeline([
      {
        targets: container,
        opacity: [0, 1],
        scale: [0.97, 1],
        duration: 250,
        ease: 'out(3)'
      }
    ])
  }
</script>

<style scoped>
  .blog-main {
    /* One column stretching to the visible viewport so card grid + pager feel grounded */
    @apply mx-auto flex w-full max-w-[min(96rem,calc(100%-1.5rem))] flex-col px-3;
    /* Breathing room under nav without the old oversized gap */
    @apply pt-5 pb-8 md:pt-7 md:pb-10;
    min-height: calc(100vh - var(--vp-nav-height) - 3rem);
    min-height: calc(100dvh - var(--vp-nav-height) - 3rem);
  }

  .pagination-header {
    @apply position-relative mx-auto mt-0 flex shrink-0;
    @apply w-full max-w-[min(96rem,calc(100%-1.5rem))] px-3 pb-1;
  }
</style>
