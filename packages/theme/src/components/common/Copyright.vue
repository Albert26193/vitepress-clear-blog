<template>
  <div class="site-footer">
    <a class="vitepress" :href="website">{{ webTitle }}</a>
    <a v-if="icpNumber" class="ml-4" href="https://beian.miit.gov.cn/">{{
      icpNumber
    }}</a>
    <br />
    Powered by
    <a class="vitepress" target="_blank" href="//vitepress.vuejs.org/"
      >VitePress</a
    >
    Theme by
    <a class="vitepress" target="_blank" :href="themeLink">Vitepress-blog</a>
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'

  const { site, theme } = useData()
  const website = theme.value.website
  const webTitle = site.value.title
  const icpNumber = theme.value.icpNumber || ''
  const themeLink =
    theme.value.themeLink ||
    'https://github.com/Albert26193/vitepress-clear-blog'
</script>

<style scoped>
  .site-footer {
    color: #888;
    text-align: center;
    font-size: 0.75rem;
    width: 100%;
    padding: 15px 0;
    overflow: auto;
  }

  .vitepress {
    color: var(--vp-c-text-1);
    font-weight: 700;
  }
</style>
