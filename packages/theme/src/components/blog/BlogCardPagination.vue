<template>
  <div class="blog-card-pagination">
    <div ref="cardContainerRef" class="card-container slide-enter-content">
      <div
        v-for="post in currentPagePosts"
        :key="post.regularPath"
        :data-flip-key="post.regularPath"
      >
        <BlogCardItem :post="post"></BlogCardItem>
      </div>
    </div>
    <footer class="page-footer">
      <div class="pagination">
        <a
          v-for="i in pagesNum"
          :key="i"
          class="link ml-1"
          :class="{ active: pageCurrent === i }"
          @click="handlePageChange(i)"
          >{{ i }}</a
        >
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'
  import { computed, ref } from 'vue'

  import { useLayoutAnimation } from '../../composables/useLayoutAnimation'
  import { data as allPostsData } from '../../utils/node/posts.data'
  import BlogCardItem from './BlogCardItem.vue'

  const { theme } = useData()
  const pageSize = theme.value.pageSize || 9
  const pageCurrent = ref(1)

  const cardContainerRef = ref<HTMLElement>()
  const { updateLayout } = useLayoutAnimation(cardContainerRef, {
    childSelector: ':scope > div',
    duration: 350,
    ease: 'inOut(3.5)',
    enterFrom: { transform: 'translateY(15px)', opacity: 0 },
    leaveTo: { transform: 'translateY(-15px)', opacity: 0 }
  })

  // Current page posts
  const currentPagePosts = computed(() => {
    if (!allPostsData) return []
    return allPostsData.slice(
      (pageCurrent.value - 1) * pageSize,
      pageCurrent.value * pageSize
    )
  })

  // Total number of pages
  const pagesNum = computed(() => {
    if (!allPostsData) return 0
    return Math.ceil(allPostsData.length / pageSize)
  })

  const handlePageChange = (page: number) => {
    if (page === pageCurrent.value) return
    updateLayout(() => {
      pageCurrent.value = page
    })
  }

  // No URL parameter handling needed, only localStorage
</script>

<style scoped>
  /* Parent .blog-main sets viewport min-height; this grows between toolbar and bottom */
  .blog-card-pagination {
    @apply flex min-h-0 flex-1 flex-col pt-12;
    @apply md:pt-14;
  }

  .card-container {
    @apply mx-auto grid flex-1 grid-cols-1 content-start gap-x-6 gap-y-4;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
    @apply max-w-[1280px] self-stretch;
  }

  .page-footer {
    @apply mt-auto shrink-0 border-t border-gray-200 px-3 pt-6 pb-2;
    @apply dark:border-[var(--vp-c-divider)] dark:text-gray-400;
  }

  .pagination {
    @apply flex justify-center;
  }

  .pagination .link {
    @apply flex h-6 w-6 cursor-pointer items-center justify-center rounded-md;
    @apply text-gray-600 dark:text-gray-400;
  }

  .pagination .link.active {
    @apply bg-[var(--vp-c-brand)] text-gray-100 shadow-xl;
  }
</style>

<style>
  /* Override VPDoc content max-width so card grid can expand on full-width pages */
  .VPDoc:not(.has-sidebar):has(.blog-card-pagination) .content {
    max-width: min(1280px, 100%);
  }

  .VPDoc:not(.has-sidebar):has(.blog-card-pagination) .container {
    max-width: min(100%, 100vw - 64px);
  }
</style>
