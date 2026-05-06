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
      <div class="flex flex-wrap gap-1">
        <span v-for="item in partedTags" :key="item + 'key'">
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
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 1) ?? []
  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.post.regularPath
  }

  const preview = useHtmlPreview(props.post.html || '', {
    maxChineseLength: 60,
    maxEnglishWords: 60
  })
</script>

<style scoped>
  .blog-card {
    @apply relative flex flex-col;
    @apply justify-between overflow-hidden rounded-xl bg-white p-6 shadow-sm;
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
    @apply mt-2 flex items-center justify-between;
    @apply text-sm text-gray-500;
  }

  .card-time {
    @apply flex flex-wrap items-center;
    @apply dark:text-gray-300;
  }

  .card-title {
    @apply my-1 text-lg;
  }

  .describe {
    @apply my-2 text-sm text-gray-700;
    @apply mb-4 indent-2;
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

  .tag-view a {
    @apply cursor-pointer hover:text-[var(--vp-c-brand)];
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
