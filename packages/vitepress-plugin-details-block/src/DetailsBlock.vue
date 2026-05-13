<script setup lang="ts">
  import { ref, useId } from 'vue'

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
  const contentId = useId()

  const toggle = () => {
    isOpen.value = !isOpen.value
  }
</script>

<template>
  <div class="custom-block collapse-block" :class="{ 'is-open': isOpen }">
    <p
      class="custom-block-title collapse-block-title"
      role="button"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      :style="{ borderBottomColor: isOpen ? undefined : 'transparent' }"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <span
        class="collapse-block-icon"
        :class="{ 'is-open': isOpen }"
        aria-hidden="true"
      />
      <slot name="summary">{{ summary }}</slot>
    </p>
    <div
      :id="contentId"
      class="collapse-block-content"
      v-show="isOpen"
      :aria-hidden="!isOpen"
    >
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .collapse-block-title {
    cursor: pointer;
    display: flex;
    align-items: center;
    user-select: none;
  }

  .collapse-block-icon {
    display: inline-block;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    transition: transform 0.2s ease;
  }

  .collapse-block-icon::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(-45deg) translateY(-2px);
  }

  .collapse-block-icon.is-open {
    transform: rotate(90deg);
  }

  .collapse-block-content {
    padding: 4px 16px;
  }
</style>
