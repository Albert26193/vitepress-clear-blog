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
      <!-- <div v-else class="no-links">no outgoing links</div> -->
      <div class="link-title mt-8">
        <span class="i-carbon-link mr-2" />
        <span>Back Links</span>
      </div>
      <div class="page-links">
        <a
          v-for="link in backLinks"
          :key="link.relativePath"
          :href="link.fullUrl"
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
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PageLink } from '@/theme/types.d'
  import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'
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
    /* font-family: monospace; */
  }

  .link-icon.is-wiki {
    @apply text-[var(--vp-c-brand-light)];
  }

  .no-links {
    @apply text-sm text-gray-500 dark:text-gray-500;
    @apply mt-2;
  }
</style>
