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
          class="page-link"
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
  import type { PageLink } from '@/theme/types.d'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute, withBase } from 'vitepress'
  import { computed } from 'vue'

  const route = useRoute()

  const pageLinks = computed<PageLink[]>(() => {
    const currentPath = route.data.relativePath.replace(/\.md$/, '')
    console.log('Current path changed:', currentPath)
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

  .page-link {
    @apply text-sm py-[1px] px-2 rounded-md font-normal;
    @apply text-gray-600 dark:text-gray-500;
    @apply relative no-underline;
    @apply transition-colors duration-300;
  }

  .page-link::after {
    @apply content-[''];
    @apply absolute left-[50%] bottom-0;
    @apply w-0 h-[1px];
    @apply bg-[var(--vp-c-brand)];
    @apply transition-all duration-300;
    transform: translateX(-50%);
  }

  .page-link:hover {
    @apply text-[var(--vp-c-brand)];
  }

  .page-link:hover::after {
    @apply w-full;
  }

  .link-icon {
    @apply opacity-50 text-xs;
    font-family: monospace;
  }

  .link-icon.is-wiki {
    @apply text-[var(--vp-c-brand-light)];
  }

  .no-links {
    @apply text-sm text-gray-500 dark:text-gray-500;
    @apply mt-2;
  }
</style>
