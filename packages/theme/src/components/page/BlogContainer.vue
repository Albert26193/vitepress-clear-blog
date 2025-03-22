<template>
  <div class="custom-page-layout page-wrapper">
    <div class="page-content">
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
          <div v-for="post in props.posts" :key="post.regularPath">
            <BlogList :post="post"></BlogList>
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

  .page-content {
    @apply flex-1 mt-2 rounded-lg;
    /* @apply border border-gray-200 dark:border-gray-700; */
    /* @apply bg-white dark:bg-gray-800; */
    /* @apply shadow-md hover:shadow-lg transition-shadow duration-300; */
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
    position: relative;
    overflow: hidden;
  }

  /* .page-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--vp-c-brand),
      var(--vp-c-brand-light)
    );
  } */

  .page-footer {
    @apply mt-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  }

  .list-container {
    @apply space-y-0 mx-auto mt-8;
  }

  .card-container {
    @apply mx-auto mt-8 grid grid-cols-1 gap-6 w-full;
    @apply sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3;
  }

  .pagination {
    @apply flex justify-center;
  }

  .pagination .link {
    @apply w-6 h-6 flex items-center justify-center rounded-md;
    @apply text-gray-600 dark:text-gray-400;
  }

  .pagination .link.active {
    @apply text-gray-100 bg-[var(--vp-c-brand)] shadow-xl;
  }

  .btn-view {
    @apply inline-flex gap-1 bg-gray-200/80 rounded-lg py-[5px] px-2 justify-center;
    @apply text-gray-900 text-lg shadow-inner;
  }

  .btn-view .icon-wrapper {
    @apply flex items-center p-1 rounded-md;
  }

  .btn-view .icon-wrapper.active {
    @apply bg-gray-100 shadow-xl drop-shadow;
  }
</style>
