<template>
  <div class="blog-list-pagination">
    <div class="list-container slide-enter-content">
      <div v-for="(post, index) in currentPagePosts" :key="post.regularPath">
        <BlogListItem
          :post="post"
          :is-first="index === 0"
          :is-last="index === currentPagePosts.length - 1"
        ></BlogListItem>
      </div>
    </div>

    <footer class="page-footer">
      <div class="pagination">
        <a
          v-for="i in pagesNum"
          :key="i"
          class="pagination-link"
          :class="{ active: pageCurrent === i }"
          @click="handlePageChange(i)"
          >{{ i }}</a
        >
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'

  import { data as allPostsData } from '../../utils/node/posts.data'
  import BlogListItem from './BlogListItem.vue'

  const pageSize = 4
  const pageCurrent = ref(1)

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
    pageCurrent.value = page
  }

  // No URL parameter handling needed, only localStorage
</script>

<style scoped>
  /* Main Container — stretch within .blog-main (fills viewport band) */
  .blog-list-pagination {
    @apply flex min-h-0 flex-1 flex-col pt-24;
    @apply md:pt-20;
  }

  /* List Container */
  .list-container {
    @apply mx-auto min-h-0 max-w-[1280px] flex-1 space-y-0 px-3;
    @apply md:px-6 lg:px-8;
  }

  /* Page Footer */
  .page-footer {
    @apply mt-auto shrink-0 border-t border-gray-200 px-4 pt-6 pb-2;
    @apply dark:border-gray-700;
    @apply md:px-6;
  }

  /* Pagination */
  .pagination {
    @apply flex flex-wrap justify-center gap-1 pt-4;
    @apply md:gap-0 md:pt-0;
  }

  /* Pagination Link */
  .pagination-link {
    @apply flex cursor-pointer items-center justify-center rounded-md transition-all duration-200;
    @apply ml-0 h-8 w-8 text-sm;
    @apply text-gray-600 dark:text-gray-400;
    @apply hover:bg-gray-100 dark:hover:bg-gray-800;
    @apply md:ml-1 md:h-6 md:w-6 md:text-base;
  }

  /* Active Pagination Link */
  .pagination-link.active {
    @apply bg-[var(--vp-c-brand)] text-gray-100 shadow-xl;
    @apply hover:bg-[var(--vp-c-brand)] dark:hover:bg-[var(--vp-c-brand)];
  }
</style>
