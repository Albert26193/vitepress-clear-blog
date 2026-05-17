<template>
  <div class="blog-card-pagination">
    <div class="card-container slide-enter-content">
      <div v-for="post in currentPagePosts" :key="post.regularPath">
        <BlogCardItem :post="post"></BlogCardItem>
      </div>
    </div>
    <PaginationFooter
      :pages-num="pagesNum"
      :page-current="pageCurrent"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'
  import { computed, ref } from 'vue'

  import { data as allPostsData } from '../../utils/node/posts.data'
  import PaginationFooter from '../common/PaginationFooter.vue'
  import BlogCardItem from './BlogCardItem.vue'

  const { theme } = useData()
  const pageSize = theme.value.pageSizeCard || theme.value.pageSize || 9
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
  /* Parent .blog-main sets viewport min-height; this grows between toolbar and bottom */
  .blog-card-pagination {
    @apply flex min-h-0 flex-1 flex-col pt-12;
    @apply md:pt-14;
  }

  .card-container {
    @apply mx-auto grid w-full flex-1 grid-cols-1 content-start gap-x-6 gap-y-4;
    @apply md:grid-cols-2 xl:grid-cols-3;
    @apply max-w-[1280px] self-stretch;
    @apply sm:w-full md:w-[90%];
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
