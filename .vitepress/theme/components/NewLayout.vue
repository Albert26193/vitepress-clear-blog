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
      <div v-if="!layout || layout == 'doc'">
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
  import DocBanner from '@/theme/components/articles/DocBanner.vue'
  import Copyright from '@/theme/components/common/Copyright.vue'
  import HideSidebarButton from '@/theme/components/common/HideSidebarButton.vue'
  import PageLinkD3 from '@/theme/components/sidebar/PageLinkD3.vue'
  import { useDarkTransition } from '@/theme/composables/useMeta'
  import LinkSidebar from '@theme/components/sidebar/LinkSidebar.vue'
  import TagSidebar from '@theme/components/sidebar/TagSidebar.vue'
  import { useData } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { computed } from 'vue'

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter } = useData()
  const layout = computed(() => frontmatter.value.layout)
</script>
