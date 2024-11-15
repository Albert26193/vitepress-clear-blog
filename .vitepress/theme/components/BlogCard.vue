<template>
  <div
    class="blog-card flex flex-col h-full overflow-hidden justify-between border border-solid border-gray-800 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800"
  >
    <div class="post-header mb-2">
      <h2 class="post-title text-xl font-semibold mb-1">
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
      class="describe text-gray-700 dark:text-gray-300 mb-4"
    >
      {{ useCardDescription(article.frontMatter.description).value }}
    </p>
    <div v-else class="mt-4"></div>
    <div
      class="post-info flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
    >
      <div class="flex items-center">
        <timeLogo class="w-4 h-4 mr-1" />
        <span>{{ article.frontMatter.date }}</span>
      </div>
      <div class="tags flex space-x-2">
        <span
          v-for="item in article.frontMatter.tags"
          :key="item + 'key'"
          class="tag bg-blue-100 text-blue-600 rounded-full px-2 py-1 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600"
        >
          <a :href="withBase(`/tags.html?tag=${item}`)">{{ item }}</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { withBase } from 'vitepress'
  import { type PropType } from 'vue'

  import timeLogo from '../assets/icon/time.svg?component'
  import { useCardDescription } from '../composables/useMeta'
  import { type Article } from '../types'

  const props = defineProps({
    article: {
      type: Object as PropType<Article>,
      required: true
    }
  })
</script>

<style scoped>
  .blog-card-cover img {
    opacity: 0.9;
    transition: opacity 0.3s ease;
  }

  .dark .blog-card-cover img {
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .blog-card-cover:hover img {
    opacity: 1;
    padding: 2px;
  }

  .blog-content-image {
    opacity: 0.8;
    transition: all 0.5s ease;
  }

  .blog-content-image:hover {
    opacity: 1;
  }

  .post-title {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0.1rem 0;
  }

  .describe {
    font-size: 0.9375rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    /* -webkit-line-clamp: 3; */
    overflow: hidden;
    color: var(--vp-c-text-2);
    margin: 10px 0;
    line-height: 1.5rem;
  }

  .link {
    display: inline-block;
    width: 24px;
    text-align: center;
    border: 1px var(--vp-c-divider-light) solid;
    border-right: none;
    font-weight: 400;
    border-radius: 25%;
  }

  .link.active {
    background: var(--vp-c-text-1);
    color: var(--vp-c-neutral-inverse);
    background-color: var(--vp-c-brand);
  }

  .dark .link.active {
    color: var(--vp-c-neutral-inverse);
    font-weight: bolder;
  }

  @media screen and (max-width: 768px) {
    .post-list {
      padding: 14px 0 14px 0;
    }
    .post-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .post-title {
      font-size: 1.0625rem;
      font-weight: 400;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      /* -webkit-line-clamp: 2; */
      overflow: hidden;
      width: 17rem;
    }
    .describe {
      font-size: 0.9375rem;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      /* -webkit-line-clamp: 3; */
      overflow: hidden;
      margin: 0.5rem 0 1rem;
    }
  }
</style>
