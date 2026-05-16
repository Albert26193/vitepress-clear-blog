<script setup lang="ts">
  import { ref, useId } from 'vue'

  const props = defineProps({
    /**
     * Fallback summary shown when the named summary slot is not provided.
     */
    summary: {
      type: String,
      default: 'Details'
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
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 5L11 9L7 13"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
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
    color: var(--vp-c-text-1);
    user-select: none;
  }

  .collapse-block-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    color: var(--vp-c-text-1);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .collapse-block-icon.is-open {
    transform: rotate(90deg);
  }

  .collapse-block-content {
    padding: 4px 16px;
  }
</style>
