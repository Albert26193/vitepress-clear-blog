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
    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  import { useData } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { computed } from 'vue'

  import { useDarkTransition } from '../composables/useMeta'
  import DocBanner from './articles/DocBanner.vue'
  import Copyright from './common/Copyright.vue'
  import HideSidebarButton from './common/HideSidebarButton.vue'
  import LinkSidebar from './sidebar/LinkSidebar.vue'
  import PageLinkD3 from './sidebar/PageLinkD3.vue'
  import TagSidebar from './sidebar/TagSidebar.vue'

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter } = useData()
  const layout = computed(() => frontmatter.value.layout)

  const showSidebarButton = computed(() => {
    return (
      (!layout.value || layout.value == 'doc') &&
      frontmatter.value.sidebar !== false
    )
  })
</script>
