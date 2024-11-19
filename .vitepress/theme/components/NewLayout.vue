<template>
  <Layout class="clear-layout">
    <template v-if="!frontmatter.page" #doc-before>
      <div
        class="post-info meta-des mb-2 flex h-8 items-center"
        id="hack-article-des"
        ref="$des"
      >
        <div class="time-info flex items-center">
          <TimeLogo class="inline size-5 align-middle" />
          <span class="ml-2 align-middle text-sm font-semibold text-black">
            {{ frontmatter.date?.substring(0, 10) }}
          </span>
        </div>
        <div class="tags ml-8 grow">
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
  </Layout>
  <Copyright />
</template>

<script setup lang="ts">
  import { useData, withBase } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { nextTick, onMounted, provide, ref } from 'vue'

  import TimeLogo from '../assets/icon/time.svg?component'
  import {
    useDarkTransition,
    useDocMetaInsertPosition,
    useDocMetaInsertSelector
  } from '../composables/useMeta'
  import Copyright from './common/Copyright.vue'

  useDarkTransition()

  const { Layout } = DefaultTheme
  const { frontmatter } = useData()

  const $des = ref<HTMLDivElement>()

  function reposition() {
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
        nextTick().then(() => {
          reposition()
        })
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    nextTick().then(() => {
      reposition()
    })
  })

  // TODO: modify date time format:
  // 1. validate date format from frontmatter.date
  // 2. frontmatter --> date/date-time/date created/created by/created at ... --> in config.toml
  // 3. if can not get date from frontmatter, use file last modified date
</script>
