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
  /* Main Container */
  .blog-list-pagination {
    @apply flex flex-col;
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
  }

  /* List Container */
  .list-container {
    @apply mx-auto space-y-0 flex-1 max-w-[1280px] mt-8 min-h-[60vh] px-3;
    @apply md:mt-16 md:min-h-190 md:px-6 lg:px-8;
  }

  /* Page Footer */
  .page-footer {
    @apply mb-4 mt-6 border-t border-gray-200 px-4;
    @apply dark:border-gray-700;
    @apply md:mt-8 md:px-6;
  }

  /* Pagination */
  .pagination {
    @apply flex justify-center flex-wrap gap-1 pt-4;
    @apply md:gap-0 md:pt-0;
  }

  /* Pagination Link */
  .pagination-link {
    @apply flex cursor-pointer items-center justify-center rounded-md transition-all duration-200;
    @apply h-8 w-8 ml-0 text-sm;
    @apply text-gray-600 dark:text-gray-400;
    @apply hover:bg-gray-100 dark:hover:bg-gray-800;
    @apply md:h-6 md:w-6 md:ml-1 md:text-base;
  }

  /* Active Pagination Link */
  .pagination-link.active {
    @apply bg-[var(--vp-c-brand)] text-gray-100 shadow-xl;
    @apply hover:bg-[var(--vp-c-brand)] dark:hover:bg-[var(--vp-c-brand)];
  }
</style>
