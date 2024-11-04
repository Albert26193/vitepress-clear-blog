<template>
  <Layout>
    <template v-if="!frontmatter.page" #doc-before>
      <div style="padding-top: 20px" class="post-info">
        <span class="mr-2">
          <img :src="timePng" class="time-img" />
          {{ frontmatter.date?.substring(0, 10) }}
        </span>
        <span
          v-for="item in frontmatter.tags"
          :key="item"
          class="mt-2 hover:.dark:bg-blue-500 hover:bg-blue-200 hover:.dark:text-slate-100 tag rounded-full"
        >
          <a :href="withBase(`/tags.html?tag=${item}`)"> {{ item }}</a>
        </span>
      </div>
    </template>
  </Layout>
  <Copyright />
</template>

<script setup lang="ts">
  import { useData, withBase } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { nextTick, provide } from 'vue'
  import timePng from '../assets/icon/time.png'
  import Copyright from './Copyright.vue'
  const { Layout } = DefaultTheme

  const { isDark, frontmatter } = useData()

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
</script>
