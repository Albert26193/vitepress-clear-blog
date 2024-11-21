<template>
  <div class="tags">
    <span
      @click="toggleTag(String(key))"
      v-for="(_, key, index) in sortTags(tagsList)"
      :key="`tag-${index}`"
      class="tag text-sm"
      :class="{ active: selectedTags.has(String(key)) }"
    >
      {{ key }}
      <span class="count">{{ tagsList[key].length }}</span>
    </span>
  </div>
  <div class="tag-header" v-if="selectedTags.size">
    <span class="i-carbon-tag-group ml-2" />
    <span class="h-80">{{ Array.from(selectedTags).join(', ') }}</span>
  </div>
  <a
    :href="withBase(article.regularPath)"
    v-for="(article, index) in filteredArticles"
    :key="index"
    class="posts"
  >
    <div class="dark:text-slate-200 mt-1 font-bold text-slate-900">
      <div class="post-dot"></div>
      {{ article.frontMatter.title }}
    </div>
    <div class="date">{{ article.frontMatter.date }}</div>
  </a>
</template>

<script lang="ts" setup>
  import { useData, withBase } from 'vitepress'
  import { computed, ref } from 'vue'

  import { Post } from '../../types'
  import { initTags } from '../../utils/themeUtils'

  let url
  if (typeof window != 'undefined') {
    url = window.location.href.split('?')[1]
  }
  const params = new URLSearchParams(url)
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

  const selectedTags = ref(new Set<string>())
  const toggleTag = (tag: string) => {
    if (selectedTags.value.has(tag)) {
      selectedTags.value.delete(tag)
    } else {
      selectedTags.value.add(tag)
    }
  }

  const filteredArticles = computed(() => {
    if (selectedTags.value.size === 0) {
      return []
    }
    return theme.value.posts.filter((article: Post) =>
      Array.from(selectedTags.value).some((tag) =>
        article.frontMatter.tags?.includes(tag)
      )
    )
  })
</script>

<style scoped>
  .tags {
    @apply mt-3 flex flex-wrap font-semibold;
    @apply p-4 space-x-2;
    @apply border-b-dashed border-gray-500;
  }

  .count {
    @apply ml-2 font-semibold;
    @apply color-[var(--vp-c-brand)];
  }

  .count:hover {
    @apply color-[var(--vp-c-brand)];
  }

  .tag {
    @apply inline-block px-3 py-1 m-1 text-sm border rounded-full cursor-pointer transition-colors duration-300;
    border-color: var(--tag-border-color);
  }

  .tag.active {
    @apply box-border font-semibold;
    @apply border-[var(--vp-c-brand)] color-[var(--vp-c-brand)];
  }

  .tag.active .count {
    @apply transition-colors duration-300;
    @apply color-gray-700;
  }

  .tag:hover {
    @apply font-semibold;
    @apply border-[var(--tag-info-color)];
  }

  .tag:hover .count {
    @apply transition-colors duration-300;
    @apply color-[var(--tag-hover-color)];
  }

  .tag-header {
    @apply mb-2 mt-6 text-xl font-medium text-left;
    @apply color-[var(--vp-c-brand)];
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
</style>
