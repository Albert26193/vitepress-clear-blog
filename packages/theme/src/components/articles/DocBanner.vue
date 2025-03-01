<template>
  <div class="meta-des" id="hack-article-des" ref="$des">
    <!-- tags -->
    <div class="grow space-x-2 mt-2" v-if="frontmatter.tags">
      <span v-for="item in frontmatter.tags" :key="item">
        <span
          class="tag"
          @click="router.go(withBase(`/tags.html?tag=${item}`))"
        >
          {{ item }}
        </span>
      </span>
    </div>
    <div class="flex items-center mt-1">
      <!-- time -->
      <div class="i-carbon-time" />
      <span class="ml-1 align-middle text-sm">
        {{ frontmatter.date?.substring(0, 10) }}
      </span>
      <!-- word count -->
      <div class="i-carbon-document ml-3" />
      <span class="ml-1 align-middle text-sm"> {{ wordsCount }} words </span>
      <!-- author -->
      <div class="i-carbon-user ml-3" />
      <span
        class="ml-1 align-middle text-sm hover:cursor-pointer hover:text-color-[var(--vp-c-brand)]"
        @click="router.go('/about.html')"
      >
        {{ author }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  //TODO: how to calculate layout on mobile? if we have too many tags?
  import { useData, useRoute, useRouter, withBase } from 'vitepress'
  import { onMounted, ref } from 'vue'

  import { useAuthor } from '../../composables/useMeta'
  import type { PostFrontMatter } from '../../types/types.d'
  import { calculateWords } from '../../utils/client/themeUtils'

  const { frontmatter } = useData()
  const router = useRouter()
  const currentRoute = useRoute()
  console.warn(currentRoute.path, 'route')

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
    let el = docDomContainer?.querySelector('h1')
    if (!el) {
      el = docDomContainer?.querySelector('h1')
    }
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
  .meta-des {
    @apply mt-2 px-6 py-3;
    @apply border border-solid border-gray-900 rounded-md w-full;
    @apply hover:shadow-lg transition-shadow duration-300 hover:border-solid;
    @apply transition-all duration-300;
    @apply flex-col items-center space-y-4 slide-enter-content;
  }

  .tag-on-page {
    @apply cursor-pointer;
  }
  .tag-on-page a {
    @apply text-[var(--vp-c-text)] no-underline font-bold;
  }
  .tag-on-page:hover {
    @apply text-[var(--vp-c-brand)] no-underline;
  }
</style>
