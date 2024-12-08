<template>
  <Layout class="clear-layout">
    <template #doc-before>
      <div v-if="true">
        <ClientOnly>
          <DocBanner />
        </ClientOnly>
      </div>
    </template>
    <template #sidebar-nav-after>
      <TagSidebar />
    </template>
    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  // TODO: doc banner for article pages only
  import DocBanner from '@/theme/components/articles/DocBanner.vue'
  import Copyright from '@/theme/components/common/Copyright.vue'
  import { useDarkTransition } from '@/theme/composables/useMeta'
  import TagSidebar from '@theme/components/sidebar/TagSidebar.vue'
  import DefaultTheme from 'vitepress/theme'

  useDarkTransition()
  const { Layout } = DefaultTheme
</script>
