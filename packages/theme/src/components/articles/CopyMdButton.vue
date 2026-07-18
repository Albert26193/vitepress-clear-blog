<template>
  <button
    class="copy-md-button"
    type="button"
    :title="copyTitle"
    aria-label="Copy page as Markdown"
    @click="copyMarkdown"
  >
    <span :class="copyIcon" />
    <span class="copy-md-label">{{ copyLabel }}</span>
  </button>
</template>

<script setup lang="ts">
  import { useData, withBase } from 'vitepress'
  import { computed, ref } from 'vue'

  // Copies the current page as raw markdown: vitepress-plugin-llms emits a
  // cleaned sibling .md for every page at the same path as its source file,
  // so the page's own relativePath is the fetch URL. Self-contained — no
  // props/emits; reads route state from useData() directly.
  const { page } = useData()

  type CopyState = 'idle' | 'copied' | 'failed'
  const copyState = ref<CopyState>('idle')
  const copyIcon = computed(() => {
    if (copyState.value === 'copied') return 'i-carbon-checkmark'
    if (copyState.value === 'failed') return 'i-carbon-warning-alt'
    return 'i-carbon-copy'
  })
  const copyTitle = computed(() =>
    copyState.value === 'failed' ? 'Markdown not available' : 'Copy as Markdown'
  )
  const copyLabel = computed(() => {
    if (copyState.value === 'copied') return 'Copied'
    if (copyState.value === 'failed') return 'Unavailable'
    return 'MD for LLM'
  })

  let resetCopyTimer: ReturnType<typeof setTimeout> | undefined
  const flashCopyState = (state: CopyState) => {
    copyState.value = state
    clearTimeout(resetCopyTimer)
    resetCopyTimer = setTimeout(() => (copyState.value = 'idle'), 2000)
  }

  const mdCache = new Map<string, string>()

  const fetchPageMarkdown = async (): Promise<string | null> => {
    const path = page.value.relativePath
    const cached = mdCache.get(path)
    if (cached !== undefined) return cached
    try {
      const res = await fetch(encodeURI(withBase('/' + path)))
      if (!res.ok) return null
      const text = await res.text()
      // The dev server answers .md routes with the SPA HTML shell; only
      // accept real markdown so the button never copies HTML garbage.
      if (/^\s*(<!doctype|<html)/i.test(text)) return null
      mdCache.set(path, text)
      return text
    } catch {
      return null
    }
  }

  const writeClipboard = async (text: string): Promise<boolean> => {
    // Clipboard API requires a secure context (https / localhost)...
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        // fall through to the legacy path
      }
    }
    // ...so LAN-IP previews fall back to the textarea + execCommand trick.
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      // execCommand may throw in exotic browsers; treat as not copied
    }
    textarea.remove()
    return copied
  }

  const copyMarkdown = async () => {
    const text = await fetchPageMarkdown()
    flashCopyState(text && (await writeClipboard(text)) ? 'copied' : 'failed')
  }
</script>

<style scoped>
  /* Pill styling echoes the bordered tag badges in the doc banner; the label
   * collapses to icon-only on narrow screens. */
  .copy-md-button {
    @apply flex items-center gap-1;
    @apply rounded-full border border-solid border-[var(--vp-c-divider)];
    @apply px-2.5 py-[3px] text-xs;
    @apply text-[var(--vp-c-text-2)];
    @apply hover:border-[var(--vp-c-brand)] hover:text-[var(--vp-c-brand)];
    @apply transition-colors duration-300;
    background: none;
    cursor: pointer;
  }

  .copy-md-label {
    @apply hidden sm:inline;
  }
</style>
