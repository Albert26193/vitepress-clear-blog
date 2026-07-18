<template>
  <div class="link-sidebar">
    <div class="links-list">
      <div class="link-title">
        <span class="i-carbon-direction-loop-left mr-2" />
        <span>Outgoing Links</span>
      </div>
      <!-- outgoing links list -->
      <div v-if="outgoingLinks.length" class="page-links">
        <a
          v-for="link in visibleOutgoingLinks"
          :key="link.relativePath"
          :href="formatPageHref(link.fullUrl)"
          class="page-link slide-enter"
          :title="getResolvedLinkTitle(link)"
        >
          {{ getResolvedLinkTitle(link) }}
        </a>
        <button
          v-if="hiddenOutgoingCount > 0"
          class="expand-toggle"
          @click="showAllOutgoing = !showAllOutgoing"
        >
          {{ showAllOutgoing ? '… collapse' : `… ${hiddenOutgoingCount} more` }}
        </button>
      </div>
      <!-- if no links -->
      <div v-else class="no-links">No Outgoing Links</div>
      <div class="link-title mt-4">
        <span class="i-carbon-direction-loop-right mr-2" />
        <span>Back Links</span>
      </div>
      <div v-if="backLinks.length" class="page-links">
        <a
          v-for="link in visibleBackLinks"
          :key="link.relativePath"
          :href="formatPageHref(link.fullUrl)"
          class="page-link slide-enter"
          :title="getResolvedLinkTitle(link)"
        >
          {{ getResolvedLinkTitle(link) }}
        </a>
        <button
          v-if="hiddenBackCount > 0"
          class="expand-toggle"
          @click="showAllBack = !showAllBack"
        >
          {{ showAllBack ? '… collapse' : `… ${hiddenBackCount} more` }}
        </button>
      </div>
      <div v-else class="no-links">No Back Links</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { siteMetadata } from 'virtual:vitepress-analyzer'
  import { useData, useRoute, withBase } from 'vitepress'
  import { computed, ref, watch } from 'vue'

  import type { PageLink } from '../../types/analyzer'
  import { resolveLinkTitle } from '../../utils/client/title'
  import { data as allPostsData } from '../../utils/node/posts.data'

  const { site } = useData()
  const renderTitle = computed(() => {
    const value = (site.value.themeConfig as Record<string, unknown>)
      ?.renderTitle
    return typeof value === 'string' ? value : 'frontmatter_title'
  })

  const getResolvedLinkTitle = (link: PageLink): string =>
    resolveLinkTitle(link, allPostsData || [], renderTitle.value)

  const formatPageHref = (fullUrl: string): string => {
    const suffixIndex = fullUrl.search(/[?#]/)
    const pathname =
      suffixIndex === -1 ? fullUrl : fullUrl.slice(0, suffixIndex)
    const suffix = suffixIndex === -1 ? '' : fullUrl.slice(suffixIndex)

    if (
      site.value.cleanUrls ||
      pathname === '/' ||
      pathname.endsWith('.html')
    ) {
      return withBase(`${pathname}${suffix}`)
    }

    return withBase(`${pathname}.html${suffix}`)
  }

  const MAX_VISIBLE = 10

  const route = useRoute()
  const currentPath = ref(route.data.relativePath.replace(/\.md$/, ''))

  const outgoingLinks = computed<PageLink[]>(() => {
    return siteMetadata[currentPath.value]?.outgoingLinks ?? []
  })

  const backLinks = computed<PageLink[]>(() => {
    return siteMetadata[currentPath.value]?.backLinks ?? []
  })

  // Expand/collapse state for overflow links
  const showAllOutgoing = ref(false)
  const showAllBack = ref(false)

  const visibleOutgoingLinks = computed(() =>
    showAllOutgoing.value
      ? outgoingLinks.value
      : outgoingLinks.value.slice(0, MAX_VISIBLE)
  )

  const hiddenOutgoingCount = computed(() =>
    Math.max(0, outgoingLinks.value.length - MAX_VISIBLE)
  )

  const visibleBackLinks = computed(() =>
    showAllBack.value ? backLinks.value : backLinks.value.slice(0, MAX_VISIBLE)
  )

  const hiddenBackCount = computed(() =>
    Math.max(0, backLinks.value.length - MAX_VISIBLE)
  )

  watch(
    () => route.path,
    () => {
      currentPath.value = route.data.relativePath.replace(/\.md$/, '')
      // Reset expand state on route change
      showAllOutgoing.value = false
      showAllBack.value = false
    }
  )
</script>

<style scoped lang="scss">
  .link-sidebar {
    @apply px-0 py-0;
    @apply mt-4;
  }

  .link-title {
    @apply mb-2 flex items-center text-sm font-semibold;
    @apply text-[var(--vp-c-text-1)];
  }

  .links-list {
    @apply relative flex flex-col;
  }

  .page-links {
    @apply relative ml-2 flex flex-col gap-[2px] text-sm;
  }

  .page-links::before {
    content: '';
    @apply absolute top-1 left-0 h-full w-[1px] bg-gray-200;
    @apply dark:bg-gray-600;
  }

  .page-link {
    @apply relative block px-4 py-[3px] text-sm transition-colors duration-300;
    @apply font-normal hover:text-[var(--vp-c-brand)];
    @apply truncate;
  }

  .page-link:hover {
    @apply font-semibold;
  }

  .page-link:hover::before {
    content: '';
    @apply @apply absolute top-1 left-0 h-5 w-[2px];
    @apply bg-[var(--vp-c-brand)] transition-colors duration-300;
  }

  .page-link::after {
    @apply hidden h-0 overflow-hidden font-semibold;
  }

  .no-links {
    @apply text-sm text-[var(--vp-c-text-2)];
    @apply mt-0 ml-6;
  }

  .expand-toggle {
    @apply px-4 py-[3px] text-left text-sm;
    @apply text-[var(--vp-c-text-2)] hover:text-[var(--vp-c-brand)];
    @apply transition-colors duration-300;
    background: none;
    border: none;
    cursor: pointer;
  }
</style>
