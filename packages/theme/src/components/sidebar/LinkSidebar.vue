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
          {{ getTitleFromPost(link, allPostsData || []) }}
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
          :title="link.fullUrl"
        >
          {{ getTitleFromPost(link, allPostsData || []) }}
        </a>
      </div>
      <div v-else class="no-links">No Back Links</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { useRoute } from 'vitepress'
  import {
    getPageBackLinks,
    // getPageMetadata,
    getPageOutgoingLinks
  } from 'vitepress-plugin-analyzer/client'
  import type { PageLink } from 'vitepress-plugin-analyzer/types'
  import { computed, ref, watch } from 'vue'

  import { getTitleFromPost } from '../../utils/client/title'
  import { data as allPostsData } from '../../utils/node/posts.data'

  const route = useRoute()
  const currentPath = ref(route.data.relativePath.replace(/\.md$/, ''))

  const outgoingLinks = computed<PageLink[]>(() => {
    return getPageOutgoingLinks(siteMetadata, currentPath.value) || []
  })

  const backLinks = computed<PageLink[]>(() => {
    return getPageBackLinks(siteMetadata, currentPath.value) || []
  })

  watch(
    () => route.path,
    () => {
      currentPath.value = route.data.relativePath.replace(/\.md$/, '')
    }
  )
</script>

<style scoped lang="scss">
  .link-sidebar {
    @apply px-0 py-0;
    @apply mt-4;
  }

  .link-title {
    @apply mb-2 flex items-center text-base font-semibold;
    color: var(--vp-c-text-1);
  }

  .links-list {
    @apply relative flex flex-col;
  }

  .page-links {
    @apply relative ml-2 flex flex-col gap-[2px] text-sm;
  }

  .page-links::before {
    content: '';
    @apply absolute left-0 top-0 h-full w-[1px] bg-gray-200;
  }

  .page-link {
    @apply relative block px-4 py-[2px] text-sm transition-colors duration-300;
    @apply font-normal hover:text-[var(--vp-c-brand)];
  }

  .page-link:hover {
    @apply font-semibold;
  }

  .page-link:hover::before {
    content: '';
    @apply @apply absolute left-0 top-1 h-5 w-[2px] bg-[var(--vp-c-brand)] transition-colors duration-300;
  }

  .page-link::after {
    /* content: attr(title); */
    @apply hidden h-0 overflow-hidden font-semibold;
  }

  .no-links {
    @apply text-sm text-gray-400 dark:text-gray-500;
    @apply ml-6 mt-0;
  }
</style>
