<template>
  <div class="custom-page-layout max-w-880px">
    <div class="tags-container slide-enter">
      <BlogTagItem
        v-for="(_, key) in sortTags(tagsList)"
        :key="key"
        :text="String(key)"
        :active="selectedTag === String(key)"
        :count="tagsList[key].length"
        :px="3"
        :font-size="13"
        class="tag-view tag heti heti--serif font-bold"
        @click="toggleTag(String(key))"
      />
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
          {{ useTitle(article.frontMatter, article.html) }}
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
  import BlogTagItem from './BlogTagItem.vue'

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
    @apply mx-3 p-3;
    @apply md:mx-0 md:p-4;
  }

  /* Tag View — overrides base BlogTagItem for tags-page look */
  .tag-view {
    transition: all 300ms;
  }

  .tag-view.active {
    border-color: var(--vp-c-brand);
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
    @apply mx-auto flex items-center justify-between py-1;
    @apply w-full px-4;
    @apply md:w-9/10 md:px-12;
  }

  /* Post Item Title */
  .post-item-title {
    @apply min-w-0 flex-1 cursor-pointer;
    @apply hover:text-[var(--vp-c-brand)];
    @apply text-sm;
    @apply md:h-4 md:text-base;
  }

  /* Date */
  .date {
    @apply ml-2 flex-shrink-0 whitespace-nowrap;
    @apply text-xs;
    @apply md:text-sm;
  }
</style>
