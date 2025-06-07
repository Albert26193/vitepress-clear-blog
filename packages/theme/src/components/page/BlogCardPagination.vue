<template>
  <div class="blog-card-pagination">
    <div class="card-container slide-enter-content">
      <div v-for="post in currentPagePosts" :key="post.regularPath">
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
  import { computed, ref } from 'vue'

  import { data as allPostsData } from '../../utils/node/posts.data'
  import BlogCardItem from './BlogCardItem.vue'

  const pageSize = 9 // Card view typically shows more items per page
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
  .blog-card-pagination {
    @apply flex flex-col;
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
  }

  .card-container {
    @apply mx-auto mt-4 grid w-full grid-cols-1 gap-6;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
    @apply max-w-[1280px] flex-1;
    @apply min-h-190;
  }

  .page-footer {
    @apply mb-4 mt-8;
    @apply border-t border-gray-200 dark:border-gray-700 dark:bg-gray-800;
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
