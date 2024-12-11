<template>
  <div class="link-sidebar">
    <div class="links-list">
      <div class="link-title">
        <span class="i-carbon-link mr-2" />
        <span>Inner Links</span>
      </div>
      <!-- inner links list -->
      <div v-if="pageLinks.length" class="page-links">
        <a
          v-for="link in pageLinks"
          :key="link.path"
          :href="withBase(link.path)"
          class="link-item"
          :title="link.raw"
        >
          <span class="link-icon" :class="{ 'is-wiki': link.type === 'wiki' }">
            {{ link.type === 'wiki' ? '[[' : '[' }}
          </span>
          {{ link.text }}
          <span class="link-icon" :class="{ 'is-wiki': link.type === 'wiki' }">
            {{ link.type === 'wiki' ? ']]' : ']' }}
          </span>
        </a>
      </div>
      <!-- if no links -->
      <div v-else class="no-links">no inner links</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PageLink } from '@/theme/types'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute, withBase } from 'vitepress'
  import { computed } from 'vue'

  const route = useRoute()
  const pageLinks = computed<PageLink[]>(() => {
    const currentPath = route.data.relativePath.replace(/\.md$/, '')
    console.log(currentPath, globalMdMetadata)
    return globalMdMetadata[currentPath]?.innerLinks || []
  })
</script>

<style scoped>
  .link-sidebar {
    @apply px-0 py-0;
    @apply mt-12;
  }

  .link-title {
    @apply flex items-center text-base font-semibold mb-4;
    color: var(--vp-c-text-1);
  }

  .page-links {
    @apply flex flex-col gap-2;
  }

  .link-item {
    @apply text-sm py-[1px] px-2 rounded-md font-normal;
    @apply text-gray-600 dark:text-gray-300;
    @apply hover:text-[var(--vp-c-brand)] hover:font-semibold;
    @apply transition-colors duration-300;
    @apply flex items-center gap-1;
  }

  .link-icon {
    @apply opacity-50 text-xs;
    font-family: monospace;
  }

  .link-icon.is-wiki {
    @apply text-[var(--vp-c-brand-light)];
  }

  .no-links {
    @apply text-sm text-gray-500 dark:text-gray-400;
    @apply mt-2;
  }
</style>
