<template>
  <Layout class="clear-layout">
    <Copyright />
    <template #doc-before>
      <Copyright />
      <div v-if="true">
        <ClientOnly>
          <!-- <DocBanner /> -->
        </ClientOnly>
      </div>
    </template>
    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  // import { useData } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'

  // import DocBanner from './articles/DocBanner.vue'
  import Copyright from './common/Copyright.vue'

  const { Layout } = DefaultTheme
  // const { frontmatter } = useData()
</script>
