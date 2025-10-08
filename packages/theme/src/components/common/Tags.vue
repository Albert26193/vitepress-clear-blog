<template>
  <div class="custom-page-layout max-w-880px">
    <div class="tags-container slide-enter">
      <span
        @click="toggleTag(String(key))"
        v-for="(_, key) in sortTags(tagsList)"
        :key="key"
        class="tag-view tag heti heti--serif font-bold"
        :class="{ active: selectedTag === String(key) }"
      >
        {{ key }}
        <span class="count">{{ tagsList[key].length }}</span>
      </span>
    </div>
    <div class="tag-header">
      <span class="i-carbon-tag-group text-xl" />
      <span class="ml-2">
        <span
          v-if="selectedTag"
          :key="'selected-' + selectedTag"
          class="animate-bounce-in delay-300 duration-300"
        >
          {{ selectedTag }}</span
        >
        <span v-else :key="'default'" class="text-gray-400 dark:text-gray-200">
          Choose a tag to filter
        </span>
      </span>
    </div>
    <div class="slide-enter-content mt-2">
      <div
        v-for="(article, index) in filteredArticles"
        :key="index"
        class="tag-post-item"
      >
        <div
          class="heti heti--serif post-item-title"
          @click="router.go(withBase(article.regularPath))"
        >
          <div class="post-dot"></div>
          {{ useTitle(article.frontMatter, article.html || '') }}
        </div>
        <div class="date font-serif">
          {{ useTimeFormat(article.frontMatter.date) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useRouter, withBase } from 'vitepress'
  import { computed, onMounted, ref } from 'vue'

  import { useTimeFormat, useTitle } from '../../composables/useMeta'
  import { Post } from '../../types/types'
  import { initTags } from '../../utils/client/'
  import { data as allPostsData } from '../../utils/node/posts.data.js'

  const router = useRouter()
  const tagsList = computed(() => (allPostsData ? initTags(allPostsData) : {}))

  // sort tag according to dict order
  const sortTags = (tags: Record<string, Post[]>) => {
    const sortedTags = Object.keys(tags).sort((a, b) => {
      return a.localeCompare(b)
    })
    const sortedTagsList: Record<string, Post[]> = {}
    sortedTags.forEach((tag) => {
      sortedTagsList[tag] = tags[tag]
    })
    return sortedTagsList
  }

  const selectedTag = ref('')

  onMounted(() => {
    // Get tag from URL on initial load
    const urlParams = new URLSearchParams(window.location.search)
    const tagFromUrl = urlParams.get('tag')
    if (tagFromUrl && tagsList.value[tagFromUrl]) {
      selectedTag.value = tagFromUrl
    }
  })

  const toggleTag = (tag: string) => {
    if (selectedTag.value === tag) {
      selectedTag.value = ''
      // Remove tag from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('tag')
      history.pushState({}, '', url)
    } else {
      selectedTag.value = tag
      // Add tag to URL
      const url = new URL(window.location.href)
      url.searchParams.set('tag', tag)
      history.pushState({}, '', url)
    }
  }

  const filteredArticles = computed(() => {
    // If no tag is selected, return all articles
    if (!selectedTag.value) {
      return allPostsData || []
    }
    // Use the pre-computed tagsList instead of filtering again
    return tagsList.value[selectedTag.value] || []
  })
</script>

<style scoped>
  /* Tags Container */
  .tags-container {
    @apply mt-12 flex flex-wrap gap-2 border border-dashed border-gray-500;
    @apply p-3 mx-3;
    @apply md:p-4 md:mx-0;
  }

  /* Count */
  .count {
    @apply color-[var(--vp-c-brand)] ml-2;
  }

  /* Tag View */
  .tag-view {
    @apply inline-block rounded-full cursor-pointer transition-all duration-300;
    @apply px-2 py-[2px] text-[11px] font-500;
    @apply md:px-3 md:text-[13px];
  }

  /* Tag View Active */
  .tag-view.active {
    @apply box-border border-[var(--vp-c-brand)] text-[var(--vp-c-brand)];
    @apply transition-all duration-300 ring-0.5px ring-[var(--vp-c-brand)];
  }

  .tag-view.active .count {
    @apply transition-colors duration-300;
  }

  .tag-view:hover .count {
    @apply color-[var(--tag-hover-color)];
  }

  /* Tag Header */
  .tag-header {
    @apply color-[var(--vp-c-brand)] text-left font-medium font-semibold;
    @apply mx-3 mt-6 text-lg;
    @apply md:mx-4 md:text-2xl;
  }

  .tag-header .i-carbon-tag-group {
    @apply text-lg;
    @apply md:text-xl;
  }

  /* Tag Image */
  .tag-img {
    @apply mr-2 align-middle;
  }

  /* Tag Post Item */
  .tag-post-item {
    @apply flex items-center justify-between py-1 mx-auto;
    @apply w-full px-4;
    @apply md:w-9/10 md:px-12;
  }

  /* Post Item Title */
  .post-item-title {
    @apply cursor-pointer flex-1 min-w-0;
    @apply hover:text-[var(--vp-c-brand)];
    @apply text-sm;
    @apply md:text-base md:h-4;
  }

  /* Date */
  .date {
    @apply flex-shrink-0 whitespace-nowrap ml-2;
    @apply text-xs;
    @apply md:text-sm;
  }
</style>
