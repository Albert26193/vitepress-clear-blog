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
    @apply fixed inset-0 z-9999;
    /* @apply transition-opacity duration-100; */
    /* @apply animate-fade-in-left-big; */
  }

  /* .popup-wrapper:not([style*='display: none']) {
    opacity: 1;
  } */

  .popup-backdrop {
    @apply absolute inset-0 bg-gray-900/50 backdrop-blur-sm;
  }

  .popup-content {
    @apply fixed;
    @apply top-[5vh] left-[5vw];
    @apply w-[90vw] h-[90vh];
    @apply bg-white rounded-lg shadow-xl overflow-hidden;
    @apply flex flex-col justify-center items-center;
  }

  .popup-content {
    @apply absolute inset-8 bg-white rounded-lg shadow-xl overflow-hidden;
    @apply transition-transform duration-300;
    @apply flex flex-col;
    @apply border border-solid border-green-500;
  }

  /* .popup-wrapper:not([style*='display: none']) .popup-content {
    transform: scale(1);
  } */

  .popup-close-wrapper {
    @apply absolute top-4 right-4 z-10;
  }

  .popup-close-button {
    @apply h-8 w-8 rounded-full text-gray-600 bg-gray-200;
    @apply hover:bg-gray-300 hover:text-gray-900;
    @apply transition-colors duration-200;
    @apply flex items-center justify-center;
  }

  .popup-close-icon {
    @apply w-6 h-6;
  }

  .popup-body {
    @apply my-auto overflow-y-auto;
    /* @apply relative; */
    @apply transition-opacity duration-300;
    @apply border-2 border-solid border-red-500;
    /* @apply w-[95%] h-[80%]; */
  }
</style>
