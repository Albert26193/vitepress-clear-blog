<template>
  <div class="custom-page-layout page-wrapper">
    <div class="page-content">
      <button class="w-24 h-8 mt-4 ml-4" @click="toggleStatus">
        {{ currentPageType === 'ListType' ? 'Card View' : 'List View' }}
      </button>
      <div
        v-if="currentPageType === 'ListType'"
        :key="'list-view'"
        class="animate-fade-in"
      >
        <div class="list-container">
          <div v-for="post in props.posts" :key="post.regularPath">
            <BlogList :post="post"></BlogList>
          </div>
        </div>
      </div>
      <div v-if="currentPageType === 'cardType'" :key="'card-view'">
        <div class="card-container">
          <div v-for="post in props.posts" :key="post.regularPath">
            <BlogCard :post="post"></BlogCard>
          </div>
        </div>
      </div>
    </div>
    <footer class="page-footer">
      <div class="pagination">
        <a
          v-for="i in props.pagesNum"
          :key="i"
          class="link ml-1"
          :class="{ active: pageCurrent === i }"
          :href="
            withBase(i === 1 ? '/pages/index.html' : `/pages/page_${i}.html`)
          "
          >{{ i }}</a
        >
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
  import BlogCard from '@/theme/components/page/BlogCard.vue'
  import BlogList from '@/theme/components/page/BlogList.vue'
  import { Post } from '@/theme/types.d'
  import { withBase } from 'vitepress'
  import { type PropType, onMounted, ref } from 'vue'

  const props = defineProps({
    posts: {
      type: Array as PropType<Post[]>,
      required: true
    },
    pageCurrent: {
      type: Number as PropType<number>,
      required: true
    },
    pagesNum: {
      type: Number as PropType<number>,
      required: true
    }
  })

  type pageType = 'cardType' | 'ListType'
  const currentPageType = ref<pageType>('cardType')

  onMounted(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const viewFromUrl = urlParams.get('view')
    if (viewFromUrl === 'list' || viewFromUrl === 'card') {
      currentPageType.value = viewFromUrl === 'list' ? 'ListType' : 'cardType'
    }
  })

  const toggleStatus = () => {
    const newType =
      currentPageType.value === 'cardType' ? 'ListType' : 'cardType'
    currentPageType.value = newType

    const url = new URL(window.location.href)
    url.searchParams.set('view', newType === 'ListType' ? 'list' : 'card')
    history.pushState({}, '', url)
  }
</script>

<style scoped>
  .page-wrapper {
    @apply min-h-screen flex flex-col;
  }

  .page-content {
    @apply flex-1;
  }

  .page-footer {
    @apply mt-auto py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  }

  .list-container {
    @apply space-y-4 mx-auto mt-12;
  }

  .card-container {
    @apply mx-auto mt-12 grid grid-cols-1 gap-4 w-full;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
  }

  .pagination {
    @apply mt-6 flex justify-center;
  }
</style>
