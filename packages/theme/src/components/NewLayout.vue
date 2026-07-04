<template>
  <Layout class="clear-layout">
    <template #doc-before>
      <div v-if="showDocBanner">
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
      <div class="slide-enter-content flex h-[80vh] flex-col">
        <div>
          <D3PageSidebar />
          <SidebarLink />
        </div>
        <div>
          <SidebarTag />
        </div>
        <div class="flex-grow" />
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

    <template #layout-bottom>
      <Copyright v-if="showCopyright" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
  import { useData, useRoute } from 'vitepress'
  import DefaultTheme from 'vitepress/theme-without-fonts'
  import { computed, defineAsyncComponent, watchEffect } from 'vue'

  import { useDarkTransition } from '../composables/useMeta'
  import Collections from './Collections.vue'
  import Timeline from './Timeline.vue'
  import DocBanner from './articles/DocBanner.vue'
  import BlogMain from './blog/BlogMain.vue'
  import Copyright from './common/Copyright.vue'
  import HideSidebarButton from './common/HideSidebarButton.vue'
  import Tags from './common/Tags.vue'
  import SidebarLink from './sidebar/SidebarLink.vue'
  import SidebarTag from './sidebar/SidebarTag.vue'

  const D3PageSidebar = defineAsyncComponent(
    () => import('./d3/D3PageSidebar.vue')
  )

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter, page, site } = useData()
  const route = useRoute()
  const layout = computed(() => frontmatter.value.layout)

  /** Index-style routes only embed custom UI in markdown; DocBanner is for real posts. */
  const showDocBanner = computed(() => {
    const p = route.path.replace(/\.html$/, '')
    return !/^\/(pages|timeline|tags|collections)(\/|$)/.test(p)
  })

  const ROUTE_COMPONENTS = {
    timeline: Timeline,
    tags: Tags,
    collections: Collections,
    pages: BlogMain
  } as const

  const currentComponent = computed(() => {
    const path = route.path.replace(/\.html$/, '')
    const match = path.match(/^\/([^/?]+)/)
    return match
      ? ROUTE_COMPONENTS[match[1] as keyof typeof ROUTE_COMPONENTS]
      : null
  })

  const showCopyright = computed(() => page.value.relativePath === 'index.md')

  const showSidebarButton = computed(() => {
    return (
      (!layout.value || layout.value == 'doc') &&
      !frontmatter.value.page &&
      frontmatter.value.sidebar !== false
    )
  })

  // Force sidebar visible on page-type layouts even if localStorage has it hidden
  watchEffect(() => {
    if (typeof document === 'undefined') return

    if (!showSidebarButton.value) {
      document.documentElement.style.setProperty('--vp-sidebar-width', '272px')
      const sidebar = document.querySelector('.VPSidebar')
      const sidebarTitle = document.querySelector('.VPNavBarTitle')
      if (sidebar) sidebar.classList.remove('hidden')
      if (sidebarTitle) sidebarTitle.classList.remove('hidden')
    }
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
    if (typeof document === 'undefined') return

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
