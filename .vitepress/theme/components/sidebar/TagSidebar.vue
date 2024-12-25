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
          class="page-link slide-enter"
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
  import type { Post } from '@/theme/types.d'
  import { useData, useRoute, withBase } from 'vitepress'
  import { computed, ref } from 'vue'

  const { theme, frontmatter } = useData()

  const currentPath = useRoute().data.relativePath.replace(/\.md$/, '')

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
    // if no tags, return empty
    if (!currentTags.value.length) {
      return []
    }
    // filter posts
    return posts.filter((post) => {
      console.log(post.regularPath, currentPath)
      // exclude current article
      if (withBase(post.regularPath) === `/${currentPath}.html`) {
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
    @apply flex items-center text-base font-semibold mb-4;
    color: var(--vp-c-text-1);
  }

  .current-tags {
    @apply flex flex-wrap gap-x-1 gap-y-2 pb-4;
    @apply border-b-1 border-b-dashed border-gray-800;
  }

  .sidebar-tag {
    @apply px-2 py-1 inline-block;
    @apply text-gray-900 border-gray-700;
    @apply font-normal;
  }

  .sidebar-tag::after {
    content: attr(data-text);
    @apply hidden font-semibold overflow-hidden h-0;
  }

  .tag-active {
    @apply box-border;
    @apply border-[var(--vp-c-brand)] color-[var(--vp-c-brand)];
  }

  .related-posts {
    @apply flex flex-col gap-[3px] mt-4 relative ml-2;
  }

  .related-posts::before {
    content: '';
    @apply absolute left-0 top-0 h-full w-[1px] bg-gray-200;
  }

  .page-link {
    @apply relative block px-4 py-[2px] text-sm transition-colors duration-300;
    @apply hover:text-[var(--vp-c-brand)] font-normal;
  }

  .page-link:hover {
    @apply font-semibold;
  }

  .page-link:hover::before {
    content: '';
    @apply absolute left-0 top-1 h-5 w-[2px] bg-[var(--vp-c-brand)] transition-colors duration-300;
  }

  .no-related {
    @apply text-sm text-gray-400 dark:text-gray-500;
    @apply mt-3 ml-6;
  }
</style>
