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
          :class="['tag sidebar-tag', { 'tag-active': activeTag === tag }]"
          @click="toggleTagFilter(tag)"
        >
          {{ tag }}
        </div>
      </div>
      <!-- related posts -->
      <div v-if="filteredRelatedPosts.length" class="related-posts">
        <a
          v-for="post in filteredRelatedPosts"
          :key="post.regularPath"
          :href="withBase(post.regularPath)"
          class="post-link"
        >
          {{ post.frontMatter.title }}
        </a>
      </div>
      <!-- if no related posts -->
      <div v-else class="no-related"> no related posts </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Post } from '@/theme/types'
  import { useData, withBase } from 'vitepress'
  import { computed, ref } from 'vue'

  const { theme, frontmatter } = useData()

  // get tags for current article
  const currentTags = computed(() => {
    return frontmatter.value.tags || []
  })

  // active tag for filtering
  const activeTag = ref<string | null>(null)

  // toggle tag filter
  const toggleTagFilter = (tag: string) => {
    activeTag.value = activeTag.value === tag ? null : tag
  }

  // get related posts
  const filteredRelatedPosts = computed(() => {
    const posts = theme.value.posts as Post[]
    const currentPath = frontmatter.value.relativePath

    // if no tags, return empty
    if (!currentTags.value.length) {
      return []
    }

    // filter posts
    return posts.filter((post) => {
      // exclude current article
      if (post.regularPath === currentPath) {
        return false
      }

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
    @apply flex items-center text-lg font-semibold mb-4;
    color: var(--vp-c-text-1);
  }

  .current-tags {
    @apply flex flex-wrap gap-2 pb-4;
    @apply border-b-1 border-b-solid border-gray-300;
  }

  .sidebar-tag {
    @apply px-3 py-1;
    @apply text-gray-600 border-gray-500;
  }

  .tag-active {
    @apply box-border;
    @apply border-[var(--vp-c-brand)] color-[var(--vp-c-brand)];
  }

  .related-posts {
    @apply flex flex-col gap-2 pt-4;
  }

  .post-link {
    @apply text-sm py-[1px] px-2 rounded-md font-normal;
    @apply text-gray-600 dark:text-gray-300;
    @apply hover:text-[var(--vp-c-brand)] hover:font-semibold;
    @apply transition-colors duration-300;
  }

  .no-related {
    @apply text-sm text-gray-500 dark:text-gray-400;
    @apply mt-2;
  }
</style>
