<template>
  <div class="custom-page-layout">
    <button class="w-16 h-8 mt-4 ml-4" @click="toggleStatus">
      {{ `click me` }}
    </button>
    <div
      class="border-solid border-gray-400"
      v-if="currentPageType === 'ListType'"
    >
      <div v-auto-animate="{ duration: 300 }" class="">
        <div v-for="(article, index) in posts" :key="index">
          <BlogList :article="article"></BlogList>
        </div>
      </div>
    </div>
    <div
      class="border-solid border-gray-400"
      v-if="currentPageType === 'cardType'"
    >
      <div v-auto-animate="{ duration: 300 }" class="card-container">
        <div v-for="(article, index) in posts" :key="index">
          <BlogCard :article="article"></BlogCard>
        </div>
      </div>
    </div>
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
  </div>
</template>

<script lang="ts" setup>
  import BlogCard from '@/theme/components/page/BlogCard.vue'
  import BlogList from '@/theme/components/page/BlogList.vue'
  import { Article } from '@/theme/types'
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
  .card-container {
    @apply border-b p-6;
    @apply mx-auto mt-2 grid grid-cols-1 gap-4;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
  }

  .post-header {
    @apply flex items-center justify-between;
  }

  .pagination {
    @apply mt-6 flex justify-center;
  }
</style>
