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
  import DocBanner from '@/components/articles/DocBanner.vue'
  import Copyright from '@/components/common/Copyright.vue'
  import HideSidebarButton from '@/components/common/HideSidebarButton.vue'
  import LinkSidebar from '@/components/sidebar/LinkSidebar.vue'
  import PageLinkD3 from '@/components/sidebar/PageLinkD3.vue'
  import TagSidebar from '@/components/sidebar/TagSidebar.vue'
  import { useDarkTransition } from '@/composables/useMeta'
  import { useData } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { computed } from 'vue'

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
