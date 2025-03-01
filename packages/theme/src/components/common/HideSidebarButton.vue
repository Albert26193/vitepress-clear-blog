<template>
  <div class="hidden sm:block">
    <button @click="toggleSidebar" class="toggle-button">
      <div v-if="isHidden" class="i-carbon-chevron-right" />
      <div v-else class="i-carbon-chevron-left" />
    </button>
  </div>
</template>

<script lang="ts" setup>
  import { useLocalStorage } from '@vueuse/core'
  import { onMounted, watch } from 'vue'

  const isHidden = useLocalStorage('vp-sidebar-hidden', false)

  const updateDOM = (hidden: boolean) => {
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

  watch(isHidden, updateDOM, { immediate: true })
  onMounted(() => updateDOM(isHidden.value))
</script>

<style scoped>
  .toggle-button {
    @apply hover:bg-gray-100 border-[1.5px] border-gray-600 border-solid;
    @apply rounded-full shadow-lg transition-all duration-300 ml-4 shadow-gray-400/80;
    @apply text-xl flex items-center justify-center font-bold;
    @apply h-7 w-7;
    @apply hover:shadow-inner;
    /* @apply hidden sm:block; */
  }

  :deep(.VPSidebar) {
    transition: width 0.3s ease;
  }
</style>
