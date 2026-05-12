<template>
  <div class="block" v-show="currentWidthHasSidebar">
    <button @click="toggleSidebar" class="toggle-button">
      <div v-if="isHidden" class="i-carbon-chevron-right" />
      <div v-else class="i-carbon-chevron-left" />
    </button>
  </div>
</template>

<script lang="ts" setup>
  import { useLocalStorage } from '@vueuse/core'
  import { onMounted, onUnmounted, ref, watch } from 'vue'

  const isHidden = useLocalStorage('vp-sidebar-hidden', false)

  const currentWidthHasSidebar = ref(false)

  const MOBILE_BREAKPOINT = 960

  // TODO: fix error here
  const checkSidebarExists = () => {
    currentWidthHasSidebar.value = window.innerWidth > MOBILE_BREAKPOINT
  }

  const updateDOM = (hidden: boolean) => {
    if (typeof document === 'undefined') return

    document.documentElement.style.setProperty(
      '--vp-sidebar-width',
      hidden ? '0px' : '272px'
    )

    const sidebar = document.querySelector('.VPSidebar')
    const sidebarTitle = document.querySelector('.VPNavBarTitle')

    if (sidebar && sidebarTitle) {
      sidebar.classList.toggle('hidden', hidden)
      sidebarTitle.classList.toggle('hidden', hidden)
    }
  }

  const toggleSidebar = () => {
    isHidden.value = !isHidden.value
  }

  const handleResize = () => {
    checkSidebarExists()
  }

  watch(isHidden, updateDOM, { immediate: true })

  onMounted(() => {
    updateDOM(isHidden.value)
    window.addEventListener('resize', handleResize)
    checkSidebarExists()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

<style scoped>
  .toggle-button {
    @apply border-[1.5px] border-solid border-gray-500 hover:bg-gray-100;
    @apply ml-4 rounded-full;
    @apply flex items-center justify-center text-xl font-bold;
    @apply font-800 h-6 w-6 text-[17px];
    @apply hover:border-gray-800 hover:shadow-inner;
    @apply dark:border-gray-400 dark:hover:border-gray-300 dark:hover:bg-[var(--vp-c-bg)];
  }

  :deep(.VPSidebar) {
    transition: width 0.3s ease;
  }
</style>
