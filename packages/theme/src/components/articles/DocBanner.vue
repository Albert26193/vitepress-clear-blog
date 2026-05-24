<template>
  <div class="meta-des" id="hack-article-des" ref="$des">
    <!-- tags -->
    <div class="tags-container" v-if="frontmatter.tags">
      <BlogTagItem
        v-for="item in frontmatter.tags"
        :key="item"
        :text="item"
        :href="`/tags.html?tag=${item}`"
        :px="2.4"
        :font-size="12"
        class="tag"
      />
    </div>
    <div class="mt-1 flex items-center">
      <!-- time -->
      <div class="i-carbon-time" />
      <span class="ml-1 align-middle text-sm">
        {{ useTimeFormat(frontmatter.date?.substring(0, 10)) }}
      </span>
      <!-- word count -->
      <div class="i-carbon-document ml-3" />
      <span class="ml-1 align-middle text-sm"> {{ wordsCount }} words </span>
      <!-- author -->
      <div class="i-carbon-user ml-3" />
      <span
        class="ml-1 align-middle text-sm hover:cursor-pointer hover:text-[var(--vp-c-brand)]"
        role="link"
        tabindex="0"
        @click="handleAuthorClick"
        @keydown.enter="handleAuthorKeydown"
        @keydown.space.prevent="handleAuthorKeydown"
      >
        {{ author }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useData } from 'vitepress'
  import { onMounted, ref } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'
  import { useAuthor, useTimeFormat } from '../../composables/useMeta'
  import type { PostFrontMatter } from '../../types/types.d'
  import { calculateWords } from '../../utils/client/'
  import BlogTagItem from '../common/BlogTagItem.vue'

  const { frontmatter } = useData()
  const { handleClick: handleAuthorClick, handleKeydown: handleAuthorKeydown } =
    useClickAble('/about.html')

  const $des = ref<HTMLDivElement>()

  const author = useAuthor(frontmatter.value as PostFrontMatter) || 'Blogger'

  const domContainer = window.document.querySelector('#VPContent')
  const textContent =
    domContainer?.querySelector('.content-container .main')?.textContent || ''

  const wordsCount = calculateWords(textContent)
  const reposition = () => {
    if (!$des.value) {
      return
    }

    document.querySelectorAll('.meta-des').forEach((v) => v.remove())
    const docDomContainer = window.document.querySelector('#VPContent')
    const el = docDomContainer?.querySelector('h1')
    el?.['after']?.($des.value!)
  }

  onMounted(() => {
    const observer = new MutationObserver(() => {
      const targetInstance = document.querySelector('#hack-article-des')
      if (!targetInstance) {
        reposition()
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    reposition()
  })
</script>

<style scoped>
  /* Meta Description Container */
  .meta-des {
    @apply mt-2 w-full rounded-md transition-all duration-300;
    @apply slide-enter-content flex-col items-center space-y-4;
    @apply border-1 border-solid border-gray-500;
    @apply hover:ring-1px hover:ring-gray transition-shadow duration-300;
    @apply px-4 py-3;
    @apply md:px-6;
  }

  /* Tags Container */
  .tags-container {
    @apply mt-2 flex grow flex-wrap gap-x-2 gap-y-2;
  }

  /* Tag On Page */
  .tag-on-page {
    @apply cursor-pointer;
  }

  .tag-on-page a {
    @apply font-bold text-[var(--vp-c-text)] no-underline;
  }

  .tag-on-page:hover {
    @apply text-[var(--vp-c-brand)] no-underline;
  }
</style>
