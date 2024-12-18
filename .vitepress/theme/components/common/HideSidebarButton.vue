<template>
  <div class="hidden sm:block">
    <button @click="toggleSidebar" class="toggle-button">
      <div v-if="isSidebarHidden" class="i-carbon-side-panel-open" />
      <div v-else class="i-carbon-side-panel-close-filled" />
    </button>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  const isSidebarHidden = ref(false)
  const toggleSidebar = () => {
    isSidebarHidden.value = !isSidebarHidden.value
    document.documentElement.style.setProperty(
      '--vp-sidebar-width',
      isSidebarHidden.value ? '0px' : '272px'
    )
    const sidebar = document.querySelector('.VPSidebar')
    const sidebarTitle = document.querySelector('.VPNavBarTitle')
    if (sidebar && sidebarTitle) {
      if (isSidebarHidden.value) {
        sidebar.classList.add('hidden')
        sidebarTitle.classList.add('hidden')
      } else {
        sidebar.classList.remove('hidden')
        sidebarTitle.classList.remove('hidden')
      }
    }
  }
</script>

<style scoped>
  .toggle-button {
    @apply hover:bg-gray-200 border border-gray-200 border-solid;
    @apply bg-gray-100;
    @apply rounded-md shadow-xl transition-all duration-300 ml-4;
    @apply text-2xl flex items-center justify-center;
    @apply h-8 w-8;
  }
</style>
