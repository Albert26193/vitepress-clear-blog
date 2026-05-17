<template>
  <div class="site-footer">
    <a v-if="icpNumber" class="ml-4" href="https://beian.miit.gov.cn/">{{
      icpNumber
    }}</a>
    <br />
    Theme by
    <a class="vitepress-copyright-detail" target="_blank" :href="themeLink"
      >Vitepress-blog</a
    >
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'

  const { theme } = useData()
  const icpNumber = theme.value.icpNumber || ''
  const themeLink =
    theme.value.themeLink ||
    'https://github.com/Albert26193/vitepress-clear-blog'
</script>

<style scoped>
  .site-footer {
    color: var(--vp-c-text-2);
    text-align: center;
    font-size: 0.75rem;
    width: 100%;
    padding: 1px 0;
    overflow: auto;
  }

  .vitepress-copyright-detail {
    color: var(--vp-c-text-1);
    font-weight: 700;
  }
</style>
