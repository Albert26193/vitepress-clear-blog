<template>
  <Layout class="clear-layout">
    <template #doc-before>
      <div v-if="true">
        <ClientOnly>
          <DocBanner />
        </ClientOnly>
      </div>
    </template>

    <template #nav-bar-content-before>
      <div v-if="showSidebarButton">
        <HideSidebarButton />
      </div>
    </template>

    <template #sidebar-nav-before> </template>
    <template #sidebar-nav-after>
      <div class="slide-enter-content">
        <TagSidebar />
        <LinkSidebar />
        <PageLinkD3 />
      </div>
    </template>

    <!-- dynamic -->
    <template #not-found>
      <component
        :is="currentComponent"
        v-if="currentComponent"
        :params="routeParams"
      />
    </template>

    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  import { useData, useRoute } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { computed, defineAsyncComponent, watchEffect } from 'vue'

  import { useDarkTransition } from '../composables/useMeta'
  import DocBanner from './articles/DocBanner.vue'
  import Copyright from './common/Copyright.vue'
  import HideSidebarButton from './common/HideSidebarButton.vue'
  import LinkSidebar from './sidebar/LinkSidebar.vue'
  import PageLinkD3 from './sidebar/PageLinkD3.vue'
  import TagSidebar from './sidebar/TagSidebar.vue'

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter, site } = useData()
  const route = useRoute()
  const layout = computed(() => frontmatter.value.layout)

  const ROUTE_COMPONENTS = {
    timeline: defineAsyncComponent(() => import('./Timeline.vue')),
    tags: defineAsyncComponent(() => import('./common/Tags.vue')),
    collections: defineAsyncComponent(() => import('./Collections.vue')),
    pages: defineAsyncComponent(() => import('./page/Pagination.vue'))
  } as const

  const currentComponent = computed(() => {
    const path = route.path.replace(/\.html$/, '')
    const match = path.match(/^\/([^/?]+)/)
    return match
      ? ROUTE_COMPONENTS[match[1] as keyof typeof ROUTE_COMPONENTS]
      : null
  })

  const showSidebarButton = computed(() => {
    return (
      (!layout.value || layout.value == 'doc') &&
      frontmatter.value.sidebar !== false
    )
  })

  const routeParams = computed(() => {
    const [, search] = route.path.split('?')
    if (!search) return {}
    return Object.fromEntries(new URLSearchParams(search))
  })

  const siteName = computed(() => site.value.title)
  const ROUTE_TITLES = {
    timeline: `Timeline | ${siteName.value}`,
    tags: `Tags | ${siteName.value}`,
    collections: `Collections | ${siteName.value}`,
    pages: `Pagination | ${siteName.value}`
  } as const

  watchEffect(() => {
    const path = route.path.replace(/\.html$/, '')
    const match = path.match(/^\/([^/?]+)/)
    if (match) {
      const key = match[1] as keyof typeof ROUTE_TITLES
      if (ROUTE_TITLES[key]) {
        document.title = ROUTE_TITLES[key]
      }
    }
  })
</script>
