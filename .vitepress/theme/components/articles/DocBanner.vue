<template>
  <div
    class="meta-des flex-col items-center space-y-4"
    id="hack-article-des"
    ref="$des"
  >
    <!-- tags -->
    <div class="grow space-x-2">
      <span v-for="item in frontmatter.tags" :key="item" class="tag">
        <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
      </span>
    </div>
    <!-- time and word count -->
    <div class="flex items-center mt-2">
      <div class="i-carbon-time" />
      <span class="ml-1 align-middle text-sm">
        {{ frontmatter.date?.substring(0, 10) }}
      </span>
      <div class="i-carbon-document ml-3" />
      <span class="ml-1 align-middle text-sm"> {{ wordsCount }} words </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  //TODO: how to calculate layout on mobile? if we have too many tags?
  import { calculateWords } from '@/theme/utils/themeUtils'
  import { useData, withBase } from 'vitepress'
  import { onMounted, ref } from 'vue'

  const { frontmatter } = useData()
  const $des = ref<HTMLDivElement>()

  const domContainer = window.document.querySelector('#VPContent')
  const textContent =
    domContainer?.querySelector('.content-container .main')?.textContent || ''

  const wordsCount = calculateWords(textContent)
  console.log(wordsCount)
  console.log(textContent)
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
    // wordsCount.value = calculateWords(textContent)
  })
</script>

<style scoped>
  .meta-des {
    /* border-bottom: 1px solid var(--vp-c-divider); */
    @apply pb-2 mt-4;
    @apply border-b-dashed border-gray-300;
    /* @apply border-2 border-dashed border-gray-500; */
  }
</style>
