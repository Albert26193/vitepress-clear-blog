<template>
  <div class="blog-list" @click="navigateToPost">
    <div class="list-header">
      <h2 class="list-title mb-1 text-xl font-semibold">
        <a
          :href="withBase(article.regularPath)"
          class="text-color-[var(--vp-c-brand)] hover:underline"
        >
          {{ article.frontMatter.title }}
        </a>
      </h2>
    </div>
    <p
      v-if="article.frontMatter.description"
      class="describe mb-4 text-gray-700 dark:text-gray-300 indent-2"
    >
      {{ useListDescription(article.frontMatter.description).value }}
    </p>
    <div v-else class="mt-4"></div>
    <div class="list-banner">
      <div class="flex items-center flex-wrap">
        <div class="i-carbon-time mr-1" />
        <span>{{ article.frontMatter.date }}</span>
      </div>
      <div class="flex space-x-2 flex-wrap">
        <span v-for="item in partedTags" :key="item + 'key'" class="tag">
          <a @click.stop :href="withBase(`/tags.html?tag=${item}`)">{{
            item
          }}</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useListDescription } from '@/theme/composables/useMeta'
  import { type Article } from '@/theme/types'
  import { withBase } from 'vitepress'
  import { type PropType } from 'vue'

  const props = defineProps({
    article: {
      type: Object as PropType<Article>,
      required: true
    }
  })

  const partedTags = props.article.frontMatter.tags.slice(0, 4)

  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.article.regularPath
  }
</script>

<style scoped>
  .blog-list {
    @apply flex h-full flex-col justify-between overflow-hidden relative;
    @apply rounded-xl bg-white py-6 px-8 shadow-sm dark:bg-gray-800;
    @apply min-w-220px w-2/3 mx-auto;
    @apply cursor-pointer;
  }

  .blog-list::before {
    @apply content-[''] absolute inset-0 rounded-xl border-1 border-solid;
    @apply border-gray-800 pointer-events-none;
  }

  .blog-list:hover::before {
    @apply border-2 border-[var(--vp-c-brand)];
  }

  .list-banner {
    @apply flex justify-between items-center text-sm text-gray-500 mt-2;
  }

  .list-title {
    @apply text-lg my-1 cursor-pointer;
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

  .tag {
    @apply cursor-pointer hover:text-[var(--vp-c-brand)];
  }

  .tag a {
    @apply cursor-pointer hover:text-[var(--vp-c-brand)];
  }

  @media screen and (max-width: 768px) {
    .list-header {
      @apply flex items-center justify-between;
    }

    .list-title {
      @apply text-base font-normal truncate w-44;
    }

    .describe {
      @apply text-sm truncate my-2;
    }
  }
</style>
