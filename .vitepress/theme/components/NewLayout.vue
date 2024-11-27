<template>
  <Layout class="clear-layout">
    <template #doc-before>
      <div v-if="true">
        <ClientOnly>
          <DocBanner />
        </ClientOnly>
      </div>
    </template>
    <Copyright />
  </Layout>
</template>

<script setup lang="ts">
  import DocBanner from '@/theme/components/articles/DocBanner.vue'
  import Copyright from '@/theme/components/common/Copyright.vue'
  import { useDarkTransition } from '@/theme/composables/useMeta'
  import { useData } from 'vitepress'
  import DefaultTheme from 'vitepress/theme'
  import { onMounted } from 'vue'

  useDarkTransition()
  const { Layout } = DefaultTheme
  const { frontmatter } = useData()
  onMounted(() => {
    // console.log('frontmatter', frontmatter.value)
  })
</script>
