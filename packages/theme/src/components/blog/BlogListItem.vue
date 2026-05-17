<template>
  <div
    class="blog-list"
    :class="{ 'is-first-item': isFirst, 'is-last-item': isLast }"
  >
    <div class="blog-list-container">
      <!-- Column 1: Title, Date, Author -->
      <div class="column-meta">
        <div class="meta-item date-item">
          <div class="i-carbon-calendar" />
          <span class="meta-text">
            {{ useTimeFormat(post.frontMatter.date) }}
          </span>
          <div class="meta-icon-user i-carbon-user" />
          <a class="meta-link" :href="withBase('/about.html')">
            {{ author }}
          </a>
        </div>
        <div class="list-header">
          <div class="list-title">
            <span
              class="title-link"
              role="link"
              tabindex="0"
              @click="handleTitleClick"
              @keydown.enter="handleTitleClick"
              @keydown.space.prevent="handleTitleClick"
            >
              {{ useTitle(post.frontMatter, post.html) }}
            </span>
          </div>
        </div>
        <div class="tags-container">
          <BlogTagItem
            v-for="item in partedTags"
            :key="item + 'key'"
            :text="item"
            :href="`/tags.html?tag=${item}`"
            bordered
          />
        </div>
      </div>

      <!-- Divider 1 -->
      <div class="custom-divider">
        <span class="divider-extensions"></span>
      </div>

      <!-- Column 2: Content (Description) -->
      <div class="column-content">
        <div class="describe heti heti--serif">
          <template v-if="post.frontMatter.description">
            {{
              useTruncatedDescription(post.frontMatter.description as string, {
                maxChineseChars: 90,
                maxEnglishWords: 50
              }).value
            }}
          </template>
          <div v-else v-html="preview" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useRouter, withBase } from 'vitepress'
  import { PropType } from 'vue'

  import {
    useAuthor,
    useHtmlPreview,
    useTimeFormat,
    useTitle,
    useTruncatedDescription
  } from '../../composables/useMeta'
  import type { Post } from '../../types/types'
  import BlogTagItem from '../common/BlogTagItem.vue'

  const props = defineProps({
    // Post data rendered in the timeline-style list row.
    post: {
      type: Object as PropType<Post>,
      required: true
    },

    // Marks the first row so connector styling can start cleanly.
    isFirst: {
      type: Boolean,
      default: false
    },

    // Marks the final row so connector styling can end cleanly.
    isLast: {
      type: Boolean,
      default: false
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 4) ?? []

  const author = useAuthor(props.post.frontMatter) || 'Blogger'

  const preview = useHtmlPreview(props.post.html, {
    maxChineseLength: 120,
    maxEnglishWords: 60
  })

  const router = useRouter()

  function handleTitleClick() {
    router.go(withBase(props.post.regularPath))
  }
</script>

<style scoped lang="scss">
  /* Blog List Item */
  .blog-list {
    @apply relative mx-auto w-full transition-colors duration-200;
    @apply border-x-0 border-t-0 border-b border-solid;
    @apply border-gray-300 dark:border-gray-700;
    @apply md:border-b-[0.5px] md:border-gray-400 md:dark:border-gray-600;

    &.is-first-item {
      @apply border-t md:border-t-[0.5px];

      .divider-extensions::before {
        @apply absolute -top-12 h-12 w-[0.5px] -translate-x-1/2 transform content-[''];
        @apply bg-gray-400 dark:bg-gray-600;
        @apply hidden md:left-1/2 md:block;
      }
    }

    &.is-last-item {
      .divider-extensions::after {
        @apply absolute -bottom-12 h-12 w-[0.5px] -translate-x-1/2 transform content-[''];
        @apply bg-gray-400 dark:bg-gray-600;
        @apply hidden md:left-1/2 md:block;
      }
    }
  }

  /* Blog List Container */
  .blog-list-container {
    @apply flex min-h-0 flex-col items-stretch px-4 py-3;
    @apply md:min-h-42 md:flex-row md:px-6 md:py-0;
  }

  /* Meta Column */
  .column-meta {
    @apply mt-1 flex w-full flex-col justify-start py-3 pr-0 pl-0;
    @apply md:mt-2 md:w-1/3 md:min-w-[300px] md:py-4 md:pr-4 md:pl-8;
  }

  /* Content Column */
  .column-content {
    @apply flex flex-1 flex-col justify-center px-0 py-2;
    @apply md:px-4 md:py-4 md:pr-12;
  }

  /* Meta Item */
  .meta-item {
    @apply mr-0 mb-2 flex items-center text-xs;
    @apply text-gray-600 dark:text-gray-400;
    @apply md:text-sm;
  }

  .date-item {
    @apply mt-1 md:mt-2;
  }

  /* Meta Text */
  .meta-text {
    @apply ml-1;
  }

  /* Meta Icon User */
  .meta-icon-user {
    @apply ml-4;
  }

  /* Meta Link */
  .meta-link {
    @apply meta-text hover:underline hover:underline-offset-4;
    @apply ml-[1px];
  }

  /* List Header */
  .list-header {
    @apply mt-0;
  }

  /* List Title */
  .list-title {
    @apply text-lg font-semibold;
    @apply md:text-xl;
  }

  /* Title Link */
  .title-link {
    @apply text-color-[var(--vp-c-brand)] break-words transition-all duration-200;
    @apply hover:underline hover:underline-offset-6;
    @apply cursor-pointer;
  }

  /* Tags Container */
  .tags-container {
    @apply mt-2 mr-0 mb-3 flex flex-wrap justify-start gap-x-2 gap-y-[6px];
    @apply md:mr-4 md:mb-4;
  }

  /* Custom Divider */
  .custom-divider {
    @apply relative self-stretch bg-gray-400 dark:bg-gray-600;
    @apply hidden md:mx-3 md:block md:w-[0.5px];

    &::before,
    &::after {
      @apply absolute h-[6px] w-[6px] rounded-full content-[''];
      @apply bg-gray-400 dark:bg-gray-400;
      @apply left-1/2 -translate-x-1/2 transform;
    }

    &::before {
      @apply top-[-3px];
    }

    &::after {
      @apply bottom-[-3px];
    }
  }

  /* Divider Extensions */
  .divider-extensions {
    @apply absolute inset-x-0 block h-full;
  }

  /* Description */
  .describe {
    @apply mt-1 line-clamp-2 flex-grow indent-0 text-sm leading-relaxed break-words;
    @apply text-gray-700 dark:text-gray-300;
    @apply md:text-md md:mt-2 md:line-clamp-3 md:indent-2 md:leading-normal;
  }

  /* Empty Description */
  .empty-description {
    @apply h-4 flex-grow;
  }
</style>
