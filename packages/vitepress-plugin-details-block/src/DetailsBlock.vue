<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps({
    /**
     * Fallback summary shown when the named summary slot is not provided.
     */
    summary: {
      type: String,
      default: 'Click to view details'
    },
    /**
     * Initial expansion state for pages that should reveal details by default.
     */
    open: {
      type: Boolean,
      default: false
    }
  })

  const isOpen = ref(props.open)

  const toggle = () => {
    isOpen.value = !isOpen.value
  }
</script>

<template>
  <div class="vp-details-block" :class="{ 'is-open': isOpen }">
    <div class="vp-details-summary" @click="toggle">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="vp-details-icon"
        :class="{ 'is-open': isOpen }"
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <slot name="summary">{{ summary }}</slot>
    </div>
    <div class="vp-details-content" v-show="isOpen">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .vp-details-block {
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background-color: var(--vp-c-bg-soft);
    margin: 16px 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .vp-details-summary {
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    user-select: none;
  }

  .vp-details-icon {
    margin-right: 8px;
    transition: transform 0.2s ease;
    display: inline-block;
    flex-shrink: 0;
  }

  .vp-details-icon.is-open {
    transform: rotate(90deg);
  }

  .vp-details-content {
    padding: 4px 6px;
    border-top: 1px solid var(--vp-c-divider);
    background-color: transparent;
  }
</style>
