<template>
  <div class="tag-sidebar">
    <!-- tags list -->
    <div class="tags-list">
      <div class="tag-title">
        <span class="i-carbon-tag-group mr-2" />
        <span> Related Tags </span>
      </div>
      <!-- current article's tag list -->
      <div v-if="currentTags.length" class="current-tags">
        <BlogTagItem
          v-for="tag in currentTags"
          :key="tag"
          :text="tag"
          :active="activeTag === tag"
          bordered
          :py="0.5"
          :px="2"
          :font-size="12"
          class="sidebar-tag heti heti--serif"
          @click="toggleTagFilter(tag)"
        />
      </div>
      <!-- related posts -->
      <div v-if="filteredRelatedPosts.length" class="related-posts">
        <a
          v-show="showPosts"
          v-for="post in filteredRelatedPosts"
          :key="post.regularPath"
          :href="isCurrentPage(post) ? undefined : withBase(post.regularPath)"
          :title="useTitle(post.frontMatter, post.html)"
          :class="[
            'page-link slide-enter',
            { 'current-page': isCurrentPage(post) }
          ]"
          @click="isCurrentPage(post) && $event.preventDefault()"
        >
          {{ useTitle(post.frontMatter, post.html) }}
        </a>
      </div>
      <!-- if no related posts -->
      <div v-else class="no-related"> No Related Posts </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useData, useRoute, withBase } from 'vitepress'
  import { computed, onMounted, ref } from 'vue'

  import { useTitle } from '../../composables/useMeta'
  import type { Post } from '../../types/types'
  import { data as allPostsData } from '../../utils/node/posts.data.js'
  import BlogTagItem from '../common/BlogTagItem.vue'

  const { frontmatter } = useData()
  const route = useRoute()

  // get tags for current article
  const currentTags = computed(() => {
    return frontmatter.value.tags || []
  })

  // active tag for filtering
  const activeTag = ref<string | null>(null)

  // show posts flag
  const showPosts = ref(true)

  // toggle tag filter
  const toggleTagFilter = (tag: string) => {
    showPosts.value = false
    activeTag.value = activeTag.value === tag ? null : tag
    setTimeout(() => {
      showPosts.value = true
    }, 100)
  }

  // check if post is current page
  const isCurrentPage = (post: Post) => {
    return withBase(post.regularPath) === route.path
  }

  // get related posts
  const filteredRelatedPosts = computed(() => {
    const posts = allPostsData || ([] as Post[])
    // if no tags, return empty
    if (!currentTags.value.length || !posts) {
      return []
    }
    // filter posts
    return posts.filter((post) => {
      // check if post has any of the current article's tags
      const postTags = post.frontMatter.tags || []
      // if no active tag, show all related posts
      if (!activeTag.value) {
        return postTags.some((tag) => currentTags.value.includes(tag))
      }
      // if active tag is set, only show posts with that tag
      return postTags.includes(activeTag.value)
    })
  })

  const chooseFirstTag = () => {
    if (currentTags.value && currentTags.value.length > 0) {
      activeTag.value = currentTags.value[0]
    }
  }

  onMounted(() => {
    chooseFirstTag()
  })
</script>

<style scoped>
  .tag-sidebar {
    @apply px-0 py-0;
    @apply mt-6;
  }

  .tag-title {
    @apply mb-4 flex items-center text-base font-semibold;
    @apply text-gray-600 dark:text-gray-400;
  }

  .current-tags {
    @apply flex flex-wrap gap-x-1 gap-y-[6px] pb-4;
    @apply border-b-dashed border-b-1;
    @apply border-gray-300 dark:border-gray-700/60;
  }

  .related-posts {
    @apply relative mt-3 ml-2 flex flex-col gap-[2px];
    @apply max-h-40 overflow-scroll;
    @apply truncate;
  }

  .related-posts::before {
    content: '';
    @apply absolute top-1 left-0 h-full w-[1px] bg-gray-200;
    @apply dark:bg-gray-600;
  }

  .page-link {
    @apply relative block px-4 py-[3px] text-sm transition-colors duration-300;
    @apply font-normal hover:text-[var(--vp-c-brand)];
    @apply truncate;
  }

  .page-link:hover::before {
    content: '';
    @apply absolute top-1 left-0 h-5 w-[2px] bg-[var(--vp-c-brand)];
    @apply transition-colors duration-300;
  }

  .current-page {
    @apply font-semibold text-[var(--vp-c-brand)];
    cursor: default;
  }

  .current-page::before {
    content: '';
    @apply absolute top-1 left-0 h-5 w-[2px] bg-[var(--vp-c-brand)];
  }

  .no-related {
    @apply text-sm text-gray-400 dark:text-gray-500;
    @apply mt-3 ml-6;
  }
</style>
