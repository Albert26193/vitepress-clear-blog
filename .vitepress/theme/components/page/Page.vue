<template>
  <div class="custom-page-layout page-wrapper">
    <div class="page-content">
      <button class="w-16 h-8 mt-4 ml-4" @click="toggleStatus">
        {{ `click me` }}
      </button>
      <div v-if="currentPageType === 'ListType'">
        <div v-auto-animate="{ duration: 300 }" class="list-container">
          <div v-for="(article, index) in posts" :key="index">
            <BlogList :article="article"></BlogList>
          </div>
        </div>
      </div>
      <div v-if="currentPageType === 'cardType'">
        <div v-auto-animate="{ duration: 300 }" class="card-container">
          <div v-for="(article, index) in posts" :key="index">
            <BlogCard :article="article"></BlogCard>
          </div>
        </div>
      </div>
    </div>
    <footer class="page-footer">
      <div class="pagination">
        <a
          v-for="i in pagesNum"
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
  import { Article } from '@/theme/types'
  import autoAnimate from '@formkit/auto-animate'
  import { withBase } from 'vitepress'
  import { type PropType, ref } from 'vue'

  const props = defineProps({
    posts: {
      type: Array as PropType<Article[]>,
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

  const toggleStatus = () => {
    if (currentPageType.value === 'cardType') {
      currentPageType.value = 'ListType'
    } else {
      currentPageType.value = 'cardType'
    }
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
    @apply space-y-4;
  }

  .card-container {
    @apply py-6;
    @apply mx-auto mt-2 grid grid-cols-1 gap-4;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
  }

  .pagination {
    @apply mt-6 flex justify-center;
  }
</style>
