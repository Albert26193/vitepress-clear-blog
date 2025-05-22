<template>
  <div
    class="blog-list"
    :class="{ 'is-first-item': isFirst, 'is-last-item': isLast }"
  >
    <div class="blog-list-container">
      <!-- Column 1: Title, Date, Author -->
      <div class="column-meta">
        <div class="list-header">
          <h2 class="list-title">
            <a :href="withBase(post.regularPath)" class="title-link">
              {{ post.frontMatter.title }}
            </a>
          </h2>
        </div>
        <div class="meta-item date-item">
          <div class="i-carbon-calendar" />
          <span class="meta-text">
            {{ post.frontMatter.date?.substring(0, 10) }}
          </span>
        </div>
        <div class="meta-item author-item">
          <div class="i-carbon-user" />
          <a class="meta-text" :href="withBase('/about.html')">
            {{ author }}
          </a>
        </div>
      </div>

      <!-- Divider 1 -->
      <div class="custom-divider">
        <span class="divider-extensions"></span>
      </div>

      <!-- Column 2: Content (Description) -->
      <div class="column-content">
        <p
          v-if="post.frontMatter.description"
          class="describe heti heti--serif"
        >
          {{ useListDescription(post.frontMatter.description as string) }}
        </p>
        <div v-else class="describe">
          <div v-html="preview" class="heti heti--serif" />
        </div>
      </div>

      <!-- Divider 2 -->
      <div class="custom-divider">
        <span class="divider-extensions"></span>
      </div>

      <!-- Column 3: Tags -->
      <div class="column-tags">
        <div class="tags-container">
          <span
            v-for="item in partedTags"
            :key="item + 'key'"
            class="tag-wrapper"
          >
            <a
              @click.stop
              :href="withBase(`/tags.html?tag=${item}`)"
              class="tag"
            >
              {{ item }}
            </a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { PropType } from 'vue'

  import { useAuthor, useHtmlPreview } from '../../composables/useMeta'
  import { useListDescription } from '../../composables/useMeta'
  import type { Post } from '../../types/types'

  const props = defineProps({
    post: {
      type: Object as PropType<Post>,
      required: true
    },
    isFirst: {
      type: Boolean,
      default: false
    },
    isLast: {
      type: Boolean,
      default: false
    }
  })

  const partedTags = props.post.frontMatter.tags?.slice(0, 4) ?? []

  const author = useAuthor(props.post.frontMatter) || 'Blogger'

  const preview = useHtmlPreview(props.post.html || '', {
    maxChineseLength: 120,
    maxEnglishWords: 60
  })
</script>

<style scoped lang="scss">
  .blog-list {
    @apply relative mx-auto w-full;
    @apply transition-colors duration-200;
    @apply border-solid border-gray-400 dark:border-gray-600;
    // Default: only bottom border for each item
    @apply border-b-[0.5px];
    // Remove default top border, it will be added conditionally for the first item
    @apply border-t-0;
    @apply border-x-0;

    // Conditional top extension AND top border for the first blog list item
    &.is-first-item {
      @apply border-t-[0.5px]; // Add top border specifically for the first item

      .divider-extensions::before {
        @apply absolute left-1/2 h-12 w-[0.5px] content-[''];
        @apply bg-gray-400 dark:bg-gray-600;
        @apply -translate-x-1/2 transform;
        @apply -top-12;
      }
    }

    // Conditional bottom extension for the last blog list item
    &.is-last-item {
      // No change needed for border here, it already has a bottom border
      .divider-extensions::after {
        @apply absolute left-1/2 h-12 w-[0.5px] content-[''];
        @apply bg-gray-400 dark:bg-gray-600;
        @apply -translate-x-1/2 transform;
        @apply -bottom-12;
      }
    }
  }

  .blog-list-container {
    @apply min-h-42 flex px-6 py-0;
    @apply items-stretch;
  }

  /* Column Styles */
  .column-meta {
    // Title, Date, Author
    @apply mt-2 flex flex-col justify-start py-4 pl-8 pr-4;
    @apply w-1/3;
  }

  .column-content {
    // Description
    @apply flex flex-1 flex-col justify-center px-4 py-4;
  }

  .column-tags {
    // Tags
    @apply flex flex-col py-4 pl-4;
    @apply w-1/5;
  }

  /* Meta Item Adjustments */
  .meta-item {
    @apply @apply mb-2 mr-0 flex items-center text-sm;
    @apply text-gray-600 dark:text-gray-400;
  }
  .date-item {
    @apply mt-2;
  }
  .list-header {
    @apply mt-0;
  }

  .list-title {
    @apply text-xl font-semibold;
  }

  .title-link {
    @apply text-color-[var(--vp-c-brand)];
    @apply transition-all duration-200;
    @apply hover:(underline underline-offset-6);
  }

  .tags-container {
    @apply mr-4 mt-2 flex flex-wrap gap-x-2 gap-y-[6px];
    @apply align-content-start;
  }

  .tag-wrapper {
    @apply inline-block;
  }

  .tag {
    @apply cursor-pointer text-[12px] hover:text-[var(--vp-c-brand)];
  }

  /* Custom Divider styles */
  .custom-divider {
    // This IS the vertical line between columns
    @apply w-[0.5px] bg-gray-400 dark:bg-gray-600;
    @apply relative mx-3;
    @apply self-stretch;

    // Intersection Dots (top and bottom of this vertical line)
    &::before,
    &::after {
      @apply absolute left-1/2 h-[6px] w-[6px] rounded-full content-[''];
      @apply bg-gray-500 dark:bg-gray-400;
      @apply -translate-x-1/2 transform;
    }

    &::before {
      // Top dot
      @apply top-[-3px];
    }

    &::after {
      // Bottom dot
      @apply bottom-[-3px];
    }
  }

  .divider-extensions {
    @apply absolute inset-x-0 block h-full;
  }

  .describe {
    @apply text-md text-gray-700 dark:text-gray-300;
    @apply mt-2 line-clamp-3 indent-2;
    @apply flex-grow;
  }

  .empty-description {
    @apply h-4 flex-grow;
  }

  .meta-text {
    @apply ml-1;
  }
</style>
