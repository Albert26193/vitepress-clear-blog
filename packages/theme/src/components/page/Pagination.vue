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
  // import { useData } from 'vitepress' // No longer needed for posts
  import { computed, ref } from 'vue'

  // import type { PostData } from '../../types/types.d' // No longer needed
  import { data as allPostsData } from '../../utils/node/posts.js'
  // Import Post if needed for explicit typing, otherwise inferred

  // Added computed
  // Import posts data
  import BlogContainer from './BlogContainer.vue'

  const pageSize = 5
  const pageCurrent = ref(1)
  // const posts = ref([]) // Will be a computed property
  // const pagesNum = ref(1) // Will be a computed property

  // const { theme } = useData() // No longer needed for posts

  // Computed property for the posts to display on the current page
  const posts = computed(() => {
    if (!allPostsData) return []
    return allPostsData.slice(
      // Should now be Post[]
      (pageCurrent.value - 1) * pageSize,
      pageCurrent.value * pageSize
    )
  })

  // Computed property for the total number of pages
  const pagesNum = computed(() => {
    if (!allPostsData) return 0
    return Math.ceil(allPostsData.length / pageSize)
  })

  // const updatePosts = () => { // No longer needed, computed properties handle this
  //   const allPosts = theme.value.posts || []
  //   posts.value = allPosts.slice(
  //     (pageCurrent.value - 1) * pageSize,
  //     pageCurrent.value * pageSize
  //   )
  //   pagesNum.value = Math.ceil(allPosts.length / pageSize)
  //   // console.log('post', JSON.stringify(allPosts, null, 2))
  // }

  const handlePageChange = (page: number) => {
    if (page === pageCurrent.value) return
    pageCurrent.value = page
  }

  // watch(pageCurrent, () => { // No longer needed, computed properties update automatically
  //   updatePosts()
  // })

  // onMounted(() => { // No longer needed if computed properties derive from imported data
  //   updatePosts()
  // })
</script>

<style scoped>
  .blog-page {
    @apply w-full;
  }

  .page-footer {
    @apply mb-4 mt-8;
    /* @apply mt-2 mb-2; */
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
