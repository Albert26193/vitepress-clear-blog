<template>
  <Teleport to="body">
    <div v-show="show" class="popup-wrapper">
      <!-- Backdrop -->
      <div class="popup-backdrop" @click="handleClose"></div>
      <!-- Content -->
      <div class="popup-content" @click.stop>
        <!-- Close button -->
        <div class="popup-close-wrapper">
          <button
            type="button"
            @click.stop="handleClose"
            class="popup-close-button"
          >
            <div class="i-carbon-close popup-close-icon" />
          </button>
        </div>
        <!-- Slot content -->
        <div class="popup-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { Teleport, onMounted, onUnmounted, watch } from 'vue'

  const props = defineProps<{
    show: boolean
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
  }>()

  // Handle ESC key
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.show) {
      handleClose()
    }
  }

  // Handle close action
  const handleClose = () => {
    emit('close')
  }

  // Watch show prop
  watch(
    () => props.show,
    (newValue) => {
      document.body.style.overflow = newValue ? 'hidden' : ''
    },
    { immediate: true }
  )

  // Setup and cleanup
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (props.show) {
      document.body.style.overflow = ''
    }
  })
</script>

<style scoped>
  .popup-wrapper {
    @apply z-9999 fixed inset-0;
  }

  .popup-backdrop {
    @apply absolute inset-0 backdrop-blur-lg;
  }

  .popup-content {
    @apply fixed;
    @apply left-1/2 top-1/2;
    @apply h-[90vh] w-[90vw];
    margin-left: -45vw;
    margin-top: -45vh;
    @apply overflow-hidden rounded-lg bg-white shadow-xl;
    @apply flex flex-col;
    @apply transition-transform duration-300;
  }

  .popup-close-wrapper {
    @apply absolute right-4 top-4 z-10;
  }

  .popup-close-button {
    @apply h-8 w-8 rounded-full bg-gray-200 text-gray-600;
    @apply hover:bg-gray-300 hover:text-gray-900;
    @apply transition-colors duration-200;
    @apply flex items-center justify-center;
  }

  .popup-close-icon {
    @apply h-6 w-6;
  }

  .popup-body {
    @apply my-auto overflow-y-auto;
    @apply animate-bounce-in-left;
    @apply transition-opacity duration-300;
    @apply border-2 border-solid border-red-500;
  }
</style>
