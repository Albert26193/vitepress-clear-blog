<template>
  <div
    class="meta-des flex-col items-center space-y-4 slide-enter-content"
    id="hack-article-des"
    ref="$des"
  >
    <!-- tags -->
    <div class="grow space-x-2">
      <span v-for="item in frontmatter.tags" :key="item" class="tag">
        <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
      </span>
    </div>
    <div class="flex items-center mt-2">
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
      <a class="ml-1 align-middle text-sm" :href="`/about.html`">
        {{ author }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
  //TODO: how to calculate layout on mobile? if we have too many tags?
  import { useAuthor } from '@/theme/composables/useMeta'
  import type { PostFrontMatter } from '@/theme/types.d'
  import { calculateWords } from '@/theme/utils/themeUtils'
  import { useData, withBase } from 'vitepress'
  import { onMounted, ref } from 'vue'

  const { frontmatter } = useData()
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
    @apply mt-4 px-6 pt-6 pb-3;
    @apply border border-solid border-gray-300 rounded-lg w-full;
    @apply hover:shadow-md transition-shadow duration-300 hover:border-solid;
    @apply transition-all duration-300;
  }
</style>
