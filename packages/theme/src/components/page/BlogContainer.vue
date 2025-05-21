<template>
  <div class="custom-page-layout page-wrapper">
    <div class="page-content-container">
      <IconToggleButton
        v-model="currentPageType"
        :icons="[
          {
            value: 'ListType',
            iconClass: 'i-carbon-table-of-contents',
            tooltip: '列表'
          },
          { value: 'cardType', iconClass: 'i-carbon-grid', tooltip: '卡片' }
        ]"
      />
      <div v-if="currentPageType === 'ListType'" :key="'list-view'">
        <div class="list-container slide-enter-content">
          <div v-for="(post, index) in props.posts" :key="post.regularPath">
            <BlogList
              :post="post"
              :is-first="index === 0"
              :is-last="index === posts.length - 1"
            ></BlogList>
          </div>
        </div>
      </div>
      <div v-if="currentPageType === 'cardType'" :key="'card-view'">
        <div class="card-container slide-enter-content">
          <div v-for="post in props.posts" :key="post.regularPath">
            <BlogCard :post="post"></BlogCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useLocalStorage } from '@vueuse/core'
  import { type PropType, onMounted } from 'vue'

  import { Post } from '../../types/types'
  import IconToggleButton from '../common/IconToggleButton.vue'
  import BlogCard from './BlogCard.vue'
  import BlogList from './BlogList.vue'

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
  const currentPageType = useLocalStorage<pageType>(
    'vp-blog-view-type',
    'cardType'
  )

  onMounted(() => {
    // URL parameters take precedence over localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const viewFromUrl = urlParams.get('view')
    if (viewFromUrl === 'list' || viewFromUrl === 'card') {
      currentPageType.value = viewFromUrl === 'list' ? 'ListType' : 'cardType'
    }
    // If no URL parameter, localStorage value will be used automatically
  })
</script>

<style scoped>
  .page-wrapper {
    @apply flex flex-col;
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
  }

  .page-content-container {
    @apply mt-2 flex-1 rounded-lg;
    @apply position-relative mx-auto max-w-[1280px];
  }

  .page-footer {
    @apply mt-auto border-t border-gray-200 bg-white;
    @apply dark:border-gray-700 dark:bg-gray-800;
  }

  .list-container {
    @apply mx-auto mt-16 space-y-0;
    @apply min-h-190;
  }

  .card-container {
    @apply mx-auto mt-8 grid w-full grid-cols-1 gap-6;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
  }

  .pagination {
    @apply flex justify-center;
  }

  .pagination .link {
    @apply flex h-6 w-6 items-center justify-center rounded-md;
    @apply text-gray-600 dark:text-gray-400;
  }

  .pagination .link.active {
    @apply bg-[var(--vp-c-brand)] text-gray-100 shadow-xl;
  }

  .btn-view {
    @apply inline-flex justify-center gap-1 rounded-lg bg-gray-200/80 px-2 py-[5px];
    @apply text-lg text-gray-900 shadow-inner;
  }

  .btn-view .icon-wrapper {
    @apply flex items-center rounded-md p-1;
  }

  .btn-view .icon-wrapper.active {
    @apply bg-gray-100 shadow-xl drop-shadow;
  }
</style>
