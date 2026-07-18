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
      <div v-if="cappedRelatedPosts.length" class="related-posts">
        <a
          v-show="showPosts"
          v-for="post in cappedRelatedPosts"
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
        <a
          v-if="tagOverflowCount > 0"
          class="overflow-link"
          :href="
            withBase(
              `/tags?tag=${encodeURIComponent(activeTag || currentTags[0])}`
            )
          "
        >
          → view all {{ filteredRelatedPosts.length }}
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

  import { useTitle } from '../../composables/useMeta'
  import type { Post } from '../../types/types'
  import { data as allPostsData } from '../../utils/node/posts.data.js'
  import BlogTagItem from '../common/BlogTagItem.vue'

  const { frontmatter } = useData()
  const route = useRoute()

  // get tags for current article
  const currentTags = computed(() => {
    const tags = frontmatter.value.tags
    if (!Array.isArray(tags)) return []
    return [...new Set(tags.map((t) => String(t).trim()))]
  })

  const MAX_VISIBLE_TAG_POSTS = 10

  // active tag for filtering — default to first tag to narrow results immediately
  const activeTag = ref<string | null>(
    currentTags.value.length > 0 ? currentTags.value[0] : null
  )

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
  // decodeURI needed: VitePress page.url is percent-encoded (e.g. %E5%88%A9)
  // but Vue Router 4 route.path returns decoded Unicode
  const isCurrentPage = (post: Post) => {
    return decodeURI(withBase(post.regularPath)) === decodeURI(route.path)
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

  // Cap visible posts to prevent sidebar overflow
  const cappedRelatedPosts = computed(() =>
    filteredRelatedPosts.value.slice(0, MAX_VISIBLE_TAG_POSTS)
  )

  const tagOverflowCount = computed(() =>
    Math.max(0, filteredRelatedPosts.value.length - MAX_VISIBLE_TAG_POSTS)
  )
</script>

<style scoped>
  .tag-sidebar {
    @apply px-0 py-0;
    @apply mt-6;
  }

  .tag-title {
    @apply mb-4 flex items-center text-sm font-semibold;
    @apply text-[var(--vp-c-text-1)];
  }

  .current-tags {
    @apply flex flex-wrap gap-x-1 gap-y-[6px] pb-4;
    @apply border-b-dashed border-b-1;
    @apply border-gray-300 dark:border-gray-700/60;
  }

  .related-posts {
    @apply relative mt-3 ml-2 flex flex-col gap-[2px];
  }

  .related-posts::before {
    content: '';
    @apply absolute top-1 left-0 h-full w-[1px] bg-gray-200;
    @apply dark:bg-gray-600;
  }

  .page-link {
    @apply relative block flex-shrink-0 px-4 py-[3px] text-sm transition-colors duration-300;
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
    @apply text-sm text-[var(--vp-c-text-2)];
    @apply mt-3 ml-6;
  }

  .overflow-link {
    @apply relative block px-4 py-[3px] text-sm;
    @apply font-medium text-[var(--vp-c-brand)];
    @apply transition-colors duration-300;
    @apply hover:underline;
  }
</style>
