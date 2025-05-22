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
        <div
          v-for="tag in currentTags"
          :key="tag"
          :class="[
            'tag sidebar-tag heti heti--serif',
            { 'side-tag-active': activeTag === tag }
          ]"
          @click="toggleTagFilter(tag)"
        >
          {{ tag }}
        </div>
      </div>
      <!-- related posts -->
      <div v-if="filteredRelatedPosts.length" class="related-posts">
        <a
          v-show="showPosts"
          v-for="post in filteredRelatedPosts"
          :key="post.regularPath"
          :href="isCurrentPage(post) ? undefined : withBase(post.regularPath)"
          :class="[
            'page-link slide-enter',
            { 'current-page': isCurrentPage(post) }
          ]"
          @click="isCurrentPage(post) && $event.preventDefault()"
        >
          {{ post.frontMatter.title }}
        </a>
      </div>
      <!-- if no related posts -->
      <div v-else class="no-related"> No Related Posts </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useData, useRoute, withBase } from 'vitepress'
  import { computed, ref } from 'vue'

  import type { Post } from '../../types/types'
  import { data as allPostsData } from '../../utils/node/posts.data.js'

  const { frontmatter } = useData()
  const route = useRoute()

  // get current path in a reactive way
  const currentPath = computed(() => {
    return route.path.replace(/\.html$/, '').replace(/^\//, '')
  })

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
      // console.log(post.regularPath, currentPath.value)
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
</script>

<style scoped>
  .tag-sidebar {
    @apply px-0 py-0;
  }

  .tag-title {
    @apply mb-4 flex items-center text-base font-semibold;
    color: var(--vp-c-text-1);
  }

  .current-tags {
    @apply flex flex-wrap gap-x-1 gap-y-[6px] pb-4;
    @apply border-b-1 border-b-dashed border-gray-800;
  }

  .sidebar-tag {
    @apply inline-block px-[0.5rem] py-[3px];
    @apply border-gray-700 text-gray-900;
    @apply text-[11px] font-normal;
  }

  .sidebar-tag::after {
    content: attr(data-text);
    @apply hidden h-0 overflow-hidden font-semibold;
  }

  .side-tag-active {
    @apply box-border;
    @apply color-[var(--vp-c-brand)] border-[var(--vp-c-brand)];
  }

  .related-posts {
    @apply relative ml-2 mt-3 flex flex-col gap-[2px];
    @apply max-h-40 overflow-scroll;
    @apply truncate;
  }

  .related-posts::before {
    content: '';
    @apply absolute left-0 top-0 h-full w-[1px] bg-gray-200;
  }

  .page-link {
    @apply relative block px-4 py-[2px] text-sm transition-colors duration-300;
    @apply font-normal hover:text-[var(--vp-c-brand)];
  }

  .page-link:hover::before {
    content: '';
    @apply absolute left-0 top-1 h-5 w-[2px] bg-[var(--vp-c-brand)] transition-colors duration-300;
  }

  .current-page {
    @apply font-semibold text-[var(--vp-c-brand)];
    cursor: default;
  }

  .current-page::before {
    content: '';
    @apply absolute left-0 top-1 h-5 w-[2px] bg-[var(--vp-c-brand)];
  }

  .no-related {
    @apply text-sm text-gray-400 dark:text-gray-500;
    @apply ml-6 mt-3;
  }
</style>
