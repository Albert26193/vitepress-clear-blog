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

    <!-- 使用动态组件 -->
    <template #not-found>
      <component
        :is="currentComponent"
        v-if="currentComponent"
        :params="routeParams"
      />
      <Content v-else />
    </template>

    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  import { Content, useData, useRoute } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { computed, defineAsyncComponent } from 'vue'

  import { useDarkTransition } from '../composables/useMeta'
  import DocBanner from './articles/DocBanner.vue'
  import Copyright from './common/Copyright.vue'
  import HideSidebarButton from './common/HideSidebarButton.vue'
  import LinkSidebar from './sidebar/LinkSidebar.vue'
  import PageLinkD3 from './sidebar/PageLinkD3.vue'
  import TagSidebar from './sidebar/TagSidebar.vue'

  const ROUTE_COMPONENTS = {
    timeline: defineAsyncComponent(() => import('./Timeline.vue')),
    tags: defineAsyncComponent(() => import('./common/Tags.vue')),
    collections: defineAsyncComponent(() => import('./Collections.vue'))
  } as const

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter } = useData()
  const route = useRoute()

  const layout = computed(() => frontmatter.value.layout)

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
</script>
