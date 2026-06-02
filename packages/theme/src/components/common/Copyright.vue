<template>
  <div class="site-footer">
    <a v-if="icpNumber" class="ml-4" :href="ICP_FILING_URL">{{ icpNumber }}</a>
    <br />
    Theme by
    <a class="vitepress-copyright-detail" target="_blank" :href="themeLink"
      >Vitepress-blog</a
    >
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'

  // Official ICP filing query site — a fixed government URL, identical for
  // every site, so it stays a constant rather than user-configurable metadata.
  const ICP_FILING_URL = 'https://beian.miit.gov.cn/'

  const { theme } = useData()
  const icpNumber = theme.value.icpNumber || ''
  // themeLink default is resolved by the config provider (DEFAULT_META in
  // vitepress-plugin-config), so no repo URL is hardcoded here.
  const themeLink = theme.value.themeLink || ''
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
