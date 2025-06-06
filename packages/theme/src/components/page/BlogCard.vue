<template>
  <div class="blog-card" @click="navigateToPost">
    <div class="card-header">
      <h2 class="card-title mb-1 text-xl font-semibold">
        <a
          :href="withBase(post.regularPath)"
          class="text-color-[var(--vp-c-brand)] hover:underline-offset-6 hover:underline"
        >
          {{ useTitle(post.frontMatter, post.html || '') }}
        </a>
      </h2>
    </div>
    <p
      v-if="post.frontMatter.description"
      class="describe heti heti--serif mb-4 indent-2 text-gray-700 dark:text-gray-300"
    >
      {{
        useTruncatedDescription(post.frontMatter.description, {
          maxChineseChars: 20,
          maxEnglishWords: 15
        }).value
      }}
    </p>
    <div v-else class="mt-4">
      <div v-html="preview" class="heti heti--serif" />
    </div>
    <div class="card-banner">
      <div class="flex flex-wrap items-center">
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
    useTitle,
    useTruncatedDescription,
    useTimeFormat
  } from '../../composables/useMeta'
  import type { Post } from '../../types/types'

  const props = defineProps({
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 2) ?? []
  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.post.regularPath
  }

  const preview = useHtmlPreview(props.post.html || '', {
    maxChineseLength: 120,
    maxEnglishWords: 60
  })
</script>

<style scoped>
  .blog-card {
    @apply relative flex h-full flex-col justify-between overflow-hidden;
    @apply rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800;
    @apply min-w-220px;
    @apply cursor-pointer;
  }

  .blog-card::before {
    @apply border-1 absolute inset-0 rounded-xl border-solid content-[''];
    @apply pointer-events-none border-gray-800;
  }

  .blog-card:hover::before {
    @apply border-2 border-[var(--vp-c-brand)];
    /* @apply shadow-inner shadow-slate-500; */
  }

  .card-banner {
    @apply mt-2 flex items-center justify-between text-sm text-gray-500;
  }

  .card-title {
    @apply my-1 text-lg;
  }

  .describe {
    @apply my-2 text-sm text-gray-700 dark:text-gray-300;
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
