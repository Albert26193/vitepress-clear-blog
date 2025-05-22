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
    <div class="tag-header mx-4">
      <span class="i-carbon-tag-group text-xl" />
      <span class="ml-2">
        <span v-if="selectedTag" :key="'selected-' + selectedTag">
          {{ selectedTag }}</span
        >
        <span v-else :key="'default'" class="text-gray-400 dark:text-gray-200">
          Choose a tag to filter
        </span>
      </span>
    </div>
    <div class="slide-enter-content">
      <div
        v-for="(article, index) in filteredArticles"
        :key="index"
        class="tag-post-item"
      >
        <a
          class="heti heti--serif post-item-title"
          :href="withBase(article.regularPath)"
        >
          <div class="post-dot"></div>
          {{ article.frontMatter.title }}
        </a>
        <div class="date font-serif">{{ article.frontMatter.date }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { computed, onMounted, ref } from 'vue'

  import { Post } from '../../types/types'
  import { initTags } from '../../utils/client/'
  import { data as allPostsData } from '../../utils/node/posts.data.js'

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
  .tags-container {
    @apply mt-12 flex flex-wrap;
    @apply space-x-2 p-4;
    @apply border border-dashed border-gray-500;
  }

  .count {
    @apply color-[var(--vp-c-brand)] ml-2;
  }

  .tag-view {
    @apply m-1 inline-block rounded-full border px-3 py-[2px] text-[13px];
    @apply cursor-pointer transition-colors duration-300;
    @apply hover:border-[var(--tag-info-color)];
    @apply font-500;
  }

  .tag-view.active {
    @apply box-border;
    @apply transition-colors duration-300;
    @apply border-[var(--vp-c-brand)] bg-[var(--vp-c-brand)] text-white;
  }

  .tag-view.active .count {
    @apply text-white transition-colors duration-300;
  }

  .tag-view:hover .count {
    @apply color-[var(--tag-hover-color)];
  }

  .tag-header {
    @apply color-[var(--vp-c-brand)] mb-2 mt-6 text-left text-2xl font-medium;
    @apply font-semibold;
  }

  .tag-img {
    @apply mr-2 align-middle;
  }

  @media screen and (max-width: 768px) {
    .tag-header {
      @apply text-xl;
    }
    .date {
      @apply text-sm;
    }
  }

  .tag-post-item {
    @apply flex items-center justify-between px-12 py-1;
    @apply w-9/10 mx-auto;
  }

  .post-item-title {
    @apply h-4;
    @apply hover:text-[var(--vp-c-brand)] hover:underline hover:underline-offset-8;
  }
</style>
