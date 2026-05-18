<template>
  <div
    class="blog-card"
    role="link"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleKeydown"
    @keydown.space.prevent="handleKeydown"
  >
    <div class="card-header">
      <h2 class="card-title mb-1 text-xl font-semibold">
        <span class="text-color-[var(--vp-c-brand)]">
          {{ useTitle(post.frontMatter, post.html) }}
        </span>
      </h2>
    </div>
    <div v-if="post.frontMatter.description" class="describe heti heti--serif">
      {{
        useTruncatedDescription(post.frontMatter.description, {
          maxChineseChars: 60,
          maxEnglishWords: 60
        }).value
      }}
    </div>
    <div v-else class="describe heti heti--serif">
      <div v-html="preview" />
    </div>
    <div class="card-banner">
      <div class="card-time">
        <div class="i-carbon-time mr-1" />
        <span>{{ useTimeFormat(post.frontMatter.date) }}</span>
      </div>
      <!-- tags -->
      <div class="card-tags">
        <BlogTagItem
          v-for="item in partedTags"
          :key="item + 'key'"
          :text="item"
          :href="`/tags.html?tag=${item}`"
          bordered
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { PropType } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'
  import {
    useHtmlPreview,
    useTimeFormat,
    useTitle,
    useTruncatedDescription
  } from '../../composables/useMeta'
  import type { Post } from '../../types/types'
  import BlogTagItem from '../common/BlogTagItem.vue'

  const props = defineProps({
    /**
     * Post data rendered as a clickable card preview.
     */
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 1) ?? []
  const { handleClick, handleKeydown } = useClickAble(props.post.regularPath)

  const preview = useHtmlPreview(props.post.html, {
    maxChineseLength: 60,
    maxEnglishWords: 60
  })
</script>

<style scoped>
  .blog-card {
    @apply relative mx-auto flex;
    @apply h-[200px] w-full max-w-[360px] min-w-[min(240px,100%)] flex-col justify-start overflow-hidden rounded-xl bg-white;
    @apply px-5 pt-4 pb-5 shadow-sm;
    @apply cursor-pointer;
    @apply dark:bg-[var(--vp-c-bg)];
  }

  .blog-card::before {
    @apply border-1 border-solid;
    @apply absolute inset-0 rounded-xl content-[''];
    @apply pointer-events-none border-gray-800;
    @apply dark:border-gray-400;
  }

  .blog-card:hover::before {
    @apply border-2 border-[var(--vp-c-brand)];
  }

  .card-banner {
    @apply mt-auto flex shrink-0 items-center justify-between;
    @apply pt-2 text-sm text-gray-500;
  }

  .card-time {
    @apply flex flex-wrap items-center;
    @apply dark:text-gray-300;
  }

  .card-title {
    @apply mt-0 mb-1 line-clamp-2 border-none pb-0 text-lg;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-decoration: none !important;
  }

  .card-title span {
    text-decoration: none !important;
  }

  .describe {
    @apply mt-1 mb-2 line-clamp-3 overflow-hidden text-sm leading-relaxed text-gray-700;
    @apply indent-2;
    @apply dark:text-gray-300/90;
  }

  .link {
    @apply inline-block w-6 text-center;
    @apply border border-r-0 border-solid border-gray-300;
    @apply rounded-md font-normal;
  }

  .link.active {
    @apply bg-gray-800 text-white;
  }

  .dark .link.active {
    @apply font-bold text-white;
  }

  .card-tags {
    @apply flex flex-wrap gap-1;
  }

  @media screen and (max-width: 768px) {
    .card-header {
      @apply flex items-center justify-between;
    }

    .card-title {
      @apply text-base font-normal;
    }

    .describe {
      @apply my-2 text-sm;
    }
  }
</style>
