<template>
  <div class="tags border border-gray-300 rounded-lg p-4">
    <span
      @click="toggleTag(String(key))"
      v-for="(_, key, index) in sortTags(tagsList)"
      :key="`tag-${index}`"
      class="tag hover:.dark:bg-blue-500 rounded-full hover:bg-blue-200"
      :class="{ active: selectedTags.has(String(key)) }"
    >
      {{ key }}
      <span class="count">{{ tagsList[key].length }}</span>
    </span>
  </div>
  <div class="tag-header mb-2 mt-6" v-if="selectedTags.size">
    <span class="i-carbon-tag-group ml-2" />
    <span class="h-80">{{ Array.from(selectedTags).join(', ') }}</span>
  </div>
  <a
    :href="withBase(article.regularPath)"
    v-for="(article, index) in filteredArticles"
    :key="index"
    class="posts"
  >
    <div
      class="post-container dark:text-slate-200 mt-1 font-bold text-slate-900"
    >
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
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    font-weight: 600;
  }

  .tags .count {
    margin-left: 2px;
    font-weight: 600;
    font-size: 1rem;
    margin-left: 8px;
    color: var(--vp-c-brand);
  }

  .tags .count:hover {
    color: var(--tag-hover-color);
  }

  .tag {
    display: inline-block;
    padding: 1px 12px;
    margin: 4px 4px 6px 4px;
    font-size: 0.875rem;
    line-height: 25px;
    border: 1px solid var(--tag-border-color);
    transition: 0.4s;
    color: var(--vp-c-text-1);
    cursor: pointer;
  }

  .tags .tag.active {
    border: 1px solid var(--vp-c-brand);
    color: var(--vp-c-brand);
    box-sizing: border-box;
    font-weight: 600;
  }

  .tags .tag.active .count {
    color: var(--vp-c-brand);
    transition: 0.4s;
  }

  .tag:hover {
    border: 1px solid var(--tag-info-color);
    font-weight: 600;
  }

  .tag:hover .count {
    color: var(--tag-hover-color);
    transition: 0.4s;
  }

  .tag-header {
    font-size: 1.5rem;
    font-weight: 500;
    text-align: left;
    color: var(--vp-c-brand);
  }

  .tag-img {
    margin-right: 8px;
    vertical-align: -45%;
  }

  @media screen and (max-width: 768px) {
    .tag-header {
      font-size: 1.5rem;
    }
    .date {
      font-size: 0.75rem;
    }
  }
</style>
