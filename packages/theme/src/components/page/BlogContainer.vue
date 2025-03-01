<template>
  <div class="custom-page-layout page-wrapper">
    <div class="page-content border border-black border-solid">
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
  import { type PropType, onMounted, ref } from 'vue'

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
  const currentPageType = ref<pageType>('cardType')

  onMounted(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const viewFromUrl = urlParams.get('view')
    if (viewFromUrl === 'list' || viewFromUrl === 'card') {
      currentPageType.value = viewFromUrl === 'list' ? 'ListType' : 'cardType'
    }
  })
</script>

<style scoped>
  .page-wrapper {
    @apply flex flex-col;
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
  }

  .page-content {
    @apply flex-1 mt-2;
    min-height: calc(100vh - var(--vp-nav-height) - 64px);
  }

  .page-footer {
    @apply mt-auto  bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  }

  .list-container {
    @apply space-y-4 mx-auto mt-8;
  }

  .card-container {
    @apply mx-auto mt-8 grid grid-cols-1 gap-4 w-full;
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
