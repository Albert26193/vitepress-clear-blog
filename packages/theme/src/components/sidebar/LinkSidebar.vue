<template>
  <div class="link-sidebar">
    <div class="links-list">
      <div class="link-title">
        <span class="i-carbon-link mr-2" />
        <span>Outgoing Links</span>
      </div>
      <!-- outgoing links list -->
      <div v-if="outgoingLinks.length" class="page-links">
        <a
          v-for="link in outgoingLinks"
          :key="link.relativePath"
          :href="link.fullUrl"
          class="page-link"
          :title="link.raw"
        >
          {{ link.text }}
        </a>
      </div>
      <!-- if no links -->
      <div v-else class="no-links">No Outgoing Links</div>
      <div class="link-title mt-6">
        <span class="i-carbon-link mr-2" />
        <span>Back Links</span>
      </div>
      <div v-if="backLinks.length" class="page-links">
        <a
          v-for="link in backLinks"
          :key="link.relativePath"
          :href="link.fullUrl"
          class="page-link"
          :title="link.raw"
        >
          {{ link.text }}
        </a>
      </div>
      <div v-else class="no-links">No Outgoing Links</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PageLink } from '@/theme/types.d'
  import { globalMdMetadata } from 'virtual:markdown-metadata'
  import { useRoute } from 'vitepress'
  import { computed, ref, watch } from 'vue'

  const route = useRoute()
  const currentPath = ref(route.data.relativePath.replace(/\.md$/, ''))

  const outgoingLinks = computed<PageLink[]>(() => {
    return globalMdMetadata[currentPath.value]?.outgoingLinks || []
  })

  const backLinks = computed<PageLink[]>(() => {
    return globalMdMetadata[currentPath.value]?.backLinks || []
  })

  console.log('total', JSON.stringify(globalMdMetadata, null, 2))
  watch(
    () => route.path,
    () => {
      currentPath.value = route.data.relativePath.replace(/\.md$/, '')
    }
  )
</script>

<style scoped>
  .link-sidebar {
    @apply px-0 py-0;
    @apply mt-12;
  }

  .link-title {
    @apply flex items-center text-base font-semibold mb-2;
    color: var(--vp-c-text-1);
  }

  .links-list {
    @apply flex flex-col  relative;
  }

  .page-links {
    @apply flex flex-col relative ml-2 gap-[3px] text-sm mt-1;
  }

  .page-links::before {
    content: '';
    @apply absolute left-0 top-0 h-full w-[1px] bg-gray-200;
  }

  .page-link {
    @apply relative block px-4 py-[2px] text-sm transition-colors duration-300;
    @apply hover:text-[var(--vp-c-brand)] font-normal;
  }

  .page-link:hover {
    @apply font-semibold;
  }

  .page-link:hover::before {
    content: '';
    @apply absolute left-0 top-1 h-5 w-[2px] bg-[var(--vp-c-brand)]
    @apply transition-colors duration-300;
  }

  .page-link::after {
    /* content: attr(title); */
    @apply hidden font-semibold overflow-hidden h-0;
  }

  .no-links {
    @apply text-sm text-gray-400 dark:text-gray-500;
    @apply mt-0 ml-6;
  }
</style>
