<template>
  <div class="hidden sm:block">
    <button @click="toggleSidebar" class="toggle-button">
      <div v-if="isHidden" class="i-carbon-side-panel-open" />
      <div v-else class="i-carbon-side-panel-close-filled" />
    </button>
  </div>
</template>

<script lang="ts" setup>
  import { useData } from 'vitepress'
  import { onMounted, onUnmounted, ref, watch } from 'vue'

  const { page } = useData()

  const isHidden = ref(false)

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    isHidden.value = params.get('sidebar') === 'hidden'
  }

  const updateUrl = (hidden: boolean) => {
    const url = new URL(window.location.href)
    if (hidden) {
      url.searchParams.set('sidebar', 'hidden')
    } else {
      url.searchParams.delete('sidebar')
    }
    window.history.replaceState({}, '', url)
  }

  const updateDOM = (hidden: boolean) => {
    document.documentElement.style.setProperty(
      '--vp-sidebar-width',
      hidden ? '0px' : '272px'
    )

    const sidebar = document.querySelector('.VPSidebar')
    const sidebarTitle = document.querySelector('.VPNavBarTitle')

    if (sidebar && sidebarTitle) {
      if (hidden) {
        sidebar.classList.add('hidden')
        sidebarTitle.classList.add('hidden')
      } else {
        sidebar.classList.remove('hidden')
        sidebarTitle.classList.remove('hidden')
      }
    }
  }

  const toggleSidebar = () => {
    isHidden.value = !isHidden.value
  }

  watch(
    isHidden,
    (newValue) => {
      updateUrl(newValue)
      updateDOM(newValue)
    },
    { immediate: true }
  )

  watch(() => page.value.relativePath, syncFromUrl)

  const handlePopState = () => {
    syncFromUrl()
  }

  onMounted(() => {
    syncFromUrl()
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
  })
</script>

<style scoped>
  .toggle-button {
    @apply hover:bg-gray-200 border border-gray-200 border-solid;
    @apply rounded-md shadow-xl transition-all duration-300 ml-4;
    @apply text-2xl flex items-center justify-center;
    @apply h-8 w-8;
  }

  :deep(.VPSidebar) {
    transition: width 0.3s ease;
  }
</style>
