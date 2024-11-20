<template>
  <div
    class="meta-des mb-2 flex h-8 items-center mt-1"
    id="hack-article-des"
    ref="$des"
  >
    <div class="time-info flex items-center">
      <TimeLogo class="inline size-5 align-middle" />
      <span class="ml-2 align-middle text-sm font-semibold text-black">
        {{ frontmatter.date?.substring(0, 10) }}
      </span>
    </div>
    <div class="ml-8 grow space-x-2">
      <span
        v-for="item in frontmatter.tags"
        :key="item"
        class="hover:.dark:bg-blue-500 hover:.dark:text-slate-100 tag rounded-full hover:bg-blue-200"
      >
        <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useData, withBase } from 'vitepress'
  import { onMounted, ref } from 'vue'

  import TimeLogo from '../../assets/icon/time.svg?component'

  const { frontmatter } = useData()

  const $des = ref<HTMLDivElement>()

  function reposition() {
    console.log($des.value, '111111')
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
      console.log('here')
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    reposition()
  })
</script>
