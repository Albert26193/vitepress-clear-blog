<template>
  <div class="blog-card" @click="navigateToPost">
    <div class="card-header">
      <h2 class="card-title mb-1 text-xl font-semibold">
        <a
          :href="withBase(post.regularPath)"
          class="text-color-[var(--vp-c-brand)] hover:underline"
        >
          {{ post.frontMatter.title }}
        </a>
      </h2>
    </div>
    <p
      v-if="post.frontMatter.description"
      class="describe mb-4 text-gray-700 dark:text-gray-300 indent-2"
    >
      {{ useCardDescription(post.frontMatter.description).value }}
    </p>
    <div v-else class="mt-4"></div>
    <div class="card-banner">
      <div class="flex items-center flex-wrap">
        <div class="i-carbon-time mr-1" />
        <span>{{ post.frontMatter.date }}</span>
      </div>
      <!-- tags -->
      <div class="flex gap-1 flex-wrap">
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
  import { useCardDescription } from '@/theme/composables/useMeta'
  import type { Post } from '@/theme/types.d'
  import { withBase } from 'vitepress'
  import { PropType } from 'vue'

  const props = defineProps({
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags.slice(0, 2)

  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.post.regularPath
  }
</script>

<style scoped>
  .blog-card {
    @apply flex h-full flex-col justify-between overflow-hidden relative;
    @apply rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800;
    @apply min-w-220px;
    @apply cursor-pointer;
  }

  .blog-card::before {
    @apply content-[''] absolute inset-0 rounded-xl border-1 border-solid;
    @apply border-gray-800 pointer-events-none;
  }

  .blog-card:hover::before {
    @apply border-2 border-[var(--vp-c-brand)];
  }

  .card-banner {
    @apply flex justify-between items-center text-sm text-gray-500 mt-2;
  }

  .card-title {
    @apply text-lg my-1;
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

  .tag-view a {
    @apply cursor-pointer hover:text-[var(--vp-c-brand)];
  }

  @media screen and (max-width: 768px) {
    .card-header {
      @apply flex items-center justify-between;
    }

    .card-title {
      @apply text-base font-normal truncate w-44;
    }

    .describe {
      @apply text-sm truncate my-2;
    }
  }
</style>
