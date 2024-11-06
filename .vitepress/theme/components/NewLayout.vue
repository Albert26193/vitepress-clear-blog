<template>
  <Layout>
    <template v-if="!frontmatter.page" #doc-before>
      <div class="post-info h-8 mb-2 flex items-center">
        <div class="tags flex-grow">
          <span
            v-for="item in frontmatter.tags"
            :key="item"
            class="hover:.dark:bg-blue-500 hover:bg-blue-200 hover:.dark:text-slate-100 tag rounded-full"
          >
            <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
          </span>
        </div>
        <div class="time-info flex items-center ml-auto">
          <TimeLogo class="inline align-middle w-5 h-5" />
          <span class="align-middle text-black font-semibold text-sm ml-2">
            {{ frontmatter.date?.substring(0, 10) }}
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
  import { nextTick, provide, ref, onMounted } from 'vue'

  import TimeLogo from '../assets/icon/time.svg?component'
  import Copyright from './Copyright.vue'
  import { json } from 'stream/consumers'
  const { Layout } = DefaultTheme

  const { isDark, frontmatter, page } = useData()
  const content = ref(null)

  onMounted(() => {
    const contentContainer = document.querySelector('.content-container')?.querySelector('.main')
    if (contentContainer) {
      const firstH1 = contentContainer.querySelector('h1')
      const cleanText = (text: string | null | undefined) =>
        JSON.stringify(text?.trim()).replace(/\s+/g, ' ').trim()
      const firstH1Text = cleanText(firstH1?.textContent)?.trim()?.replace(/#/g, '')
      const pageTitle = cleanText(page.value.title)
      console.log(`firstH1:${firstH1Text},${pageTitle}.`, firstH1Text?.length, pageTitle?.length)
      if (firstH1 && firstH1Text === pageTitle) {
        console.log('remove first h1:', firstH1Text, pageTitle)
        firstH1.remove()
      }
    }
  })

  const enableTransitions = () =>
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches

  provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
    if (!enableTransitions()) {
      isDark.value = !isDark.value
      return
    }

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      )}px at ${x}px ${y}px)`
    ]

    await document.startViewTransition(async () => {
      isDark.value = !isDark.value
      await nextTick()
    }).ready

    document.documentElement.animate(
      { clipPath: isDark.value ? clipPath.reverse() : clipPath },
      {
        duration: 300,
        easing: 'ease-in',
        pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
      }
    )
  })

  // TODO: modify date time format:
  // 1. validate date format from frontmatter.date
  // 2. frontmatter --> date/date-time/date created/created by/created at ... --> in config.toml
  // 3. if can not get date from frontmatter, use file last modified date
</script>
