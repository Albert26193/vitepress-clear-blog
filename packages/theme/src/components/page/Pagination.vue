<template>
  <BlogContainer
    :posts="posts"
    :pageCurrent="pageCurrent"
    :pagesNum="pagesNum"
    class="custom-page-layout blog-page"
  />
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
</template>

<script setup lang="ts">
  import { useData } from 'vitepress'
  import { onMounted, ref, watch } from 'vue'

  import BlogContainer from './BlogContainer.vue'

  const pageSize = 9
  const pageCurrent = ref(1)
  const posts = ref([])
  const pagesNum = ref(1)

  const { theme } = useData()

  const updatePosts = () => {
    const allPosts = theme.value.posts || []
    posts.value = allPosts.slice(
      (pageCurrent.value - 1) * pageSize,
      pageCurrent.value * pageSize
    )
    pagesNum.value = Math.ceil(allPosts.length / pageSize)
  }

  const handlePageChange = (page: number) => {
    if (page === pageCurrent.value) return
    pageCurrent.value = page
  }

  watch(pageCurrent, () => {
    updatePosts()
  })

  onMounted(() => {
    updatePosts()
  })
</script>

<style scoped>
  .blog-page {
    @apply w-8/10;
  }
  .page-footer {
    @apply mt-auto  bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  }

  .pagination {
    @apply flex justify-center;
  }

  .pagination .link {
    @apply w-6 h-6 flex items-center justify-center rounded-md cursor-pointer;
    @apply text-gray-600 dark:text-gray-400;
  }

  .pagination .link.active {
    @apply text-gray-100 bg-[var(--vp-c-brand)] shadow-xl;
  }
</style>
