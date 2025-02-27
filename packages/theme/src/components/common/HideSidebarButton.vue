<template>
  <div class="hidden sm:block">
    <button @click="toggleSidebar" class="toggle-button">
      <div v-if="isHidden" class="i-carbon-side-panel-open" />
      <div v-else class="i-carbon-side-panel-close-filled" />
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
  @apply hover:bg-gray-200 border border-gray-200 border-solid;
  @apply rounded-md shadow-xl transition-all duration-300 ml-4;
  @apply text-2xl flex items-center justify-center;
  @apply h-8 w-8;
  /* @apply hidden sm:block; */
}

:deep(.VPSidebar) {
  transition: width 0.3s ease;
}
</style>
