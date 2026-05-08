<template>
  <Teleport to="body">
    <div v-if="show" class="popup-wrapper">
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
    /** Controls popup visibility while allowing the parent to own state. */
    show: boolean
  }>()

  const emit = defineEmits<{
    /**
     * Requests that the parent close the popup after backdrop, button, or ESC actions.
     *
     * @param e - Close event name.
     */
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
    @apply fixed inset-0 z-9999;
  }

  .popup-backdrop {
    @apply absolute inset-0 backdrop-blur-lg;
    @apply bg-[var(--vp-sidebar-bg-color)];
  }

  .popup-content {
    @apply fixed;
    @apply top-1/2 left-1/2;
    @apply h-[90vh] w-[90vw];
    @apply -mt-[45vh] -ml-[45vw];
    @apply overflow-hidden rounded-lg shadow-xl;
    @apply flex flex-col;
    @apply transition-transform duration-300;
    @apply bg-[var(--vp-c-bg)];
  }

  .popup-close-wrapper {
    @apply absolute top-4 right-4 z-10;
  }

  .popup-close-button {
    @apply h-5 w-5 rounded-full bg-gray-200 text-gray-600;
    @apply hover:bg-gray-300;
    @apply transition-colors duration-200;
    @apply flex items-center justify-center;
    @apply dark:bg-gray-500 dark:hover:bg-gray-700;
  }

  .popup-close-icon {
    @apply h-4 w-4 hover:text-gray-900;
    @apply dark:text-gray-900 dark:hover:text-gray-300;
  }

  .popup-body {
    @apply my-auto overflow-y-auto;
    @apply animate-bounce-in-left;
    @apply transition-opacity duration-300;
  }
</style>
