<template>
  <div class="custom-page-layout max-w-780px">
    <div class="tags-container slide-enter-content">
      <span
        @click="toggleTag(String(key))"
        v-for="(_, key) in sortTags(tagsList)"
        :key="key"
        class="tag-view text-sm tag"
        :class="{ 'tag-active': selectedTag === String(key) }"
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
      <a
        :href="withBase(article.regularPath)"
        v-for="(article, index) in filteredArticles"
        :key="index"
        class="tag-post-item"
      >
        <div class="dark:text-slate-200 mt-1 font-normal text-slate-900">
          <div class="post-dot"></div>
          {{ article.frontMatter.title }}
        </div>
        <div class="date">{{ article.frontMatter.date }}</div>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useData, withBase } from 'vitepress'
  import { computed, onMounted, ref } from 'vue'

  import { Post } from '../../types/types'
  import { initTags } from '../../utils/themeUtils'

  const { theme } = useData()

  const tagsList = computed(() => initTags(theme.value.posts))

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
      return theme.value.posts
    }
    // Use the pre-computed tagsList instead of filtering again
    return tagsList.value[selectedTag.value] || []
  })
</script>

<style scoped>
  .tags-container {
    @apply mt-12 flex flex-wrap;
    @apply p-4 space-x-2;
    @apply border border-dashed border-gray-500;
  }

  .count {
    @apply ml-2 color-[var(--vp-c-brand)];
  }

  .tag-view {
    @apply inline-block px-3 py-[3px] m-1 text-xs border rounded-full;
    @apply cursor-pointer transition-colors duration-300;
    @apply hover:border-[var(--tag-info-color)];
  }

  .tag-view.active {
    @apply box-border;
    @apply border-[var(--vp-c-brand)] color-[var(--vp-c-brand)];
  }

  .tag-view.active .count {
    @apply transition-colors duration-300 color-[var(--vp-c-brand-1)];
  }

  .tag-view:hover .count {
    @apply color-[var(--tag-hover-color)];
  }

  .tag-header {
    @apply mb-2 mt-6 text-2xl font-medium text-left color-[var(--vp-c-brand)];
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
    @apply px-12 py-1 flex justify-between items-center;
  }
</style>
