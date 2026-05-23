<template>
  <div class="blog-list-pagination">
    <div class="list-container slide-enter-content slide-enter-fast">
      <div v-for="(post, index) in currentPagePosts" :key="post.regularPath">
        <BlogListItem
          :post="post"
          :is-first="index === 0"
          :is-last="index === currentPagePosts.length - 1"
        ></BlogListItem>
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
  import BlogListItem from './BlogListItem.vue'

  const { theme } = useData()
  const pageSize = theme.value.pageSizeList || theme.value.pageSize || 4
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
</script>

<style scoped>
  /* Main Container — stretch within .blog-main (fills viewport band) */
  .blog-list-pagination {
    @apply flex min-h-0 w-full flex-1 flex-col pt-24;
    @apply md:pt-20;
  }

  /* List Container */
  .list-container {
    @apply mx-auto min-h-0 w-full max-w-[1080px] flex-1 space-y-0;
    @apply sm:w-full md:w-[90%];
  }
</style>
