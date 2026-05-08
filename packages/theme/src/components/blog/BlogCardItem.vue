<template>
  <div class="blog-card" @click="navigateToPost">
    <div class="card-header">
      <h2 class="card-title mb-1 text-xl font-semibold">
        <span class="text-color-[var(--vp-c-brand)]">
          {{ useTitle(post.frontMatter, post.html || '') }}
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
        <span
          v-for="item in partedTags"
          :key="item + 'key'"
          class="tag-wrapper"
        >
          <a @click.stop :href="withBase(`/tags.html?tag=${item}`)" class="tag"
            >{{ item }}
          </a>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { PropType } from 'vue'

  import {
    useHtmlPreview,
    useTimeFormat,
    useTitle,
    useTruncatedDescription
  } from '../../composables/useMeta'
  import type { Post } from '../../types/types'

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
  const navigateToPost = (event: MouseEvent) => {
    window.location.href = withBase(props.post.regularPath)
  }

  const preview = useHtmlPreview(props.post.html || '', {
    maxChineseLength: 60,
    maxEnglishWords: 60
  })
</script>

<style scoped>
  .blog-card {
    @apply relative flex flex-col justify-start overflow-hidden rounded-xl bg-white;
    @apply px-5 pt-4 pb-5 shadow-sm;
    @apply min-h-[200px];
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
    @apply mt-0 mb-1 border-none pb-0 text-lg;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-decoration: none !important;
  }

  .card-title span {
    text-decoration: none !important;
  }

  .describe {
    @apply mt-1 text-sm leading-relaxed text-gray-700;
    @apply mb-2 indent-2;
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

  .tag-wrapper {
    @apply inline-block;
  }

  .tag {
    @apply inline-flex cursor-pointer items-center rounded-full border border-gray-600 px-2 py-1 text-[11px] leading-4;
    @apply text-gray-900 no-underline transition-colors duration-200 dark:text-gray-100;
  }

  .tag:hover,
  .tag:focus,
  .tag:active {
    @apply no-underline;
    border-color: var(--vp-c-brand);
    color: var(--vp-c-brand);
    padding-block-end: 0.25rem;
    text-decoration: none;
  }

  @media screen and (max-width: 768px) {
    .card-header {
      @apply flex items-center justify-between;
    }

    .card-title {
      @apply w-44 truncate text-base font-normal;
    }

    .describe {
      @apply my-2 truncate text-sm;
    }
  }
</style>
