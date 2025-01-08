<template>
  <div class="blog-list" @click="navigateToPost">
    <div class="list-header">
      <h2 class="list-title mb-1 text-xl font-semibold">
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
      {{ useListDescription(post.frontMatter.description).value }}
    </p>
    <div v-else class="mt-4"></div>
    <div class="list-banner">
      <div class="flex items-center mt-2">
        <!-- time -->
        <div class="i-carbon-time" />
        <span class="ml-1 align-middle text-sm">
          {{ post.frontMatter.date?.substring(0, 10) }}
        </span>
        <!-- author -->
        <div class="i-carbon-user ml-3" />
        <a class="ml-1 align-middle text-sm" :href="`/about.html`">
          {{ author }}
        </a>
      </div>
      <!-- tags -->
      <div class="flex space-x-2 flex-wrap">
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
  import { useListDescription } from '@theme/composables/useMeta'
  import { useAuthor } from '@theme/composables/useMeta'
  import type { Post } from '@theme/types.d'
  import { withBase } from 'vitepress'
  import { PropType } from 'vue'

  const props = defineProps({
    post: {
      type: Object as PropType<Post>,
      required: true
    }
  })

  const partedTags = props.post.frontMatter.tags.slice(0, 4)

  const author = useAuthor(props.post.frontMatter) || 'Blogger'
  const navigateToPost = (event: MouseEvent) => {
    window.location.href = props.post.regularPath
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
