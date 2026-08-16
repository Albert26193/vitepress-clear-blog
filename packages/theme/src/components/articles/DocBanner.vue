<template>
  <div class="meta-des" id="hack-article-des" ref="$des">
    <!-- tags -->
    <div class="tags-container" v-if="uniqueTags.length">
      <BlogTagItem
        v-for="item in uniqueTags"
        :key="item"
        :text="item"
        :href="`/tags.html?tag=${item}`"
        :px="2.4"
        :font-size="12"
        class="tag"
      />
    </div>
    <div class="mt-1 flex flex-wrap items-center">
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
      <!-- copy raw markdown (llms sibling .md) for LLM use + short link share -->
      <div class="meta-buttons">
        <CopyMdButton />
        <ShortlinkCopyButton />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onContentUpdated, useData } from 'vitepress'
  import { computed, onMounted, ref, shallowRef } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'
  import { useAuthor, useTimeFormat } from '../../composables/useMeta'
  import type { PostFrontMatter } from '../../types/types.d'
  import { calculateWords } from '../../utils/client/'
  import BlogTagItem from '../common/BlogTagItem.vue'
  import CopyMdButton from './CopyMdButton.vue'

  const { frontmatter } = useData()
  const uniqueTags = computed(() => {
    const tags = frontmatter.value.tags
    if (!Array.isArray(tags)) return []
    return [...new Set(tags.map((t) => String(t).trim()))]
  })
  const { handleClick: handleAuthorClick, handleKeydown: handleAuthorKeydown } =
    useClickAble('/about.html')

  const $des = ref<HTMLDivElement>()

  const author = useAuthor(() => frontmatter.value as PostFrontMatter)

  // The banner lives in the layout and persists across route changes, so the
  // word count must be recomputed whenever the rendered markdown updates.
  const wordsCount = shallowRef(0)
  const updateWordsCount = () => {
    const textContent =
      window.document.querySelector('#VPContent .content-container .main')
        ?.textContent || ''
    wordsCount.value = calculateWords(textContent)
  }

  // Covers SPA navigations; the initial ClientOnly mount happens after the
  // content's first render, so onMounted below handles that case.
  onContentUpdated(updateWordsCount)

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
    updateWordsCount()

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

  /* Action buttons (copy md / short link) stay one right-aligned group so they
   * wrap to their own row on narrow screens instead of squeezing the meta
   * info line. */
  .meta-buttons {
    @apply mt-1 flex w-full items-center justify-end gap-2;
    @apply sm:mt-0 sm:ml-auto sm:w-auto;
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
