<template>
  <div class="blog-card">
    <div class="post-header">
      <h2 class="post-title mb-1 text-xl font-semibold">
        <a
          :href="withBase(article.regularPath)"
          class="text-blue-600 hover:underline"
        >
          {{ article.frontMatter.title }}
        </a>
      </h2>
    </div>
    <p
      v-if="article.frontMatter.description"
      class="describe mb-4 text-gray-700 dark:text-gray-300 indent-2"
    >
      {{ useCardDescription(article.frontMatter.description).value }}
    </p>
    <div v-else class="mt-4"></div>
    <div class="card-banner">
      <div class="flex items-center flex-wrap">
        <div class="i-carbon-time mr-1" />
        <span>{{ article.frontMatter.date }}</span>
      </div>
      <div class="flex space-x-2 flex-wrap">
        <span v-for="item in partedTags" :key="item + 'key'" class="tag">
          <a :href="withBase(`/tags.html?tag=${item}`)">{{ item }}</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { type PropType } from 'vue'

  import { useCardDescription } from '../composables/useMeta'
  import { type Article } from '../types'

  const props = defineProps({
    article: {
      type: Object as PropType<Article>,
      required: true
    }
  })

  const partedTags = props.article.frontMatter.tags.slice(0, 2)
</script>

<style scoped>
  .blog-card {
    @apply flex h-full flex-col justify-between overflow-hidden;
    @apply rounded-xl border border-solid border-gray-800;
    @apply bg-white p-4 shadow-sm dark:bg-gray-800;
  }

  .blog-card-cover img {
    @apply opacity-90 transition-opacity duration-300 ease;
  }

  .card-banner {
    @apply flex justify-between items-center text-sm text-gray-500 mt-2;
  }

  .dark .blog-card-cover img {
    @apply opacity-70 transition-opacity duration-300 ease;
  }

  .blog-card-cover:hover img {
    @apply opacity-100 p-2;
  }

  .blog-content-image {
    @apply opacity-80 transition-all duration-500 ease;
  }

  .blog-content-image:hover {
    @apply opacity-100;
  }

  .post-title {
    @apply text-lg font-medium my-1;
  }

  .describe {
    @apply text-sm text-gray-700 dark:text-gray-300 my-2;
  }

  .link {
    @apply inline-block w-6 text-center;
    @apply border border-solid border-gray-300 border-r-0;
    @apply font-normal rounded-md;
  }

  .link.active {
    @apply bg-gray-800 text-white;
  }

  .dark .link.active {
    @apply text-white font-bold;
  }

  @media screen and (max-width: 768px) {
    .post-list {
      @apply py-4;
    }

    .post-header {
      @apply flex items-center justify-between;
    }

    .post-title {
      @apply text-base font-normal truncate w-44;
    }

    .describe {
      @apply text-sm truncate my-2;
    }
  }
</style>
