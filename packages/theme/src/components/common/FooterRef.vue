<template>
  <sup class="footnote-ref">
    <a
      :href="`#fn${props.id}`"
      :id="`fnref${props.id}`"
      class="footnote-badge-link"
      ref="footnoteRef"
    >
      <span class="footnote-badge">{{ props.text }}</span>
      <Transition name="tooltip-fade">
        <div class="footnote-tooltip" v-if="isHovered && props.content">
          <div class="tooltip-content" v-html="props.content"></div>
          <div class="tooltip-arrow"></div>
        </div>
      </Transition>
    </a>
  </sup>
</template>

<script setup lang="ts">
  import { useElementHover } from '@vueuse/core'
  import { ref } from 'vue'

  const props = defineProps({
    // footnote id
    id: {
      type: [String, Number],
      required: true
    },
    // footnote text inline display
    text: {
      type: String,
      default: '1'
    },
    // footnote content for tooltip
    content: {
      type: String,
      default: ''
    }
  })

  const footnoteRef = ref(null)
  const isHovered = useElementHover(footnoteRef, {
    delayEnter: 200,
    delayLeave: 100
  })
</script>

<style scoped>
  .footnote-ref {
    @apply relative text-xs leading-0;
    @apply ml-[5px];
  }

  .footnote-badge-link {
    @apply relative mt-0 inline p-0;
    @apply no-underline! hover:no-underline!;
  }

  .footnote-badge {
    @apply font-500 inline items-center rounded-md text-[11px] leading-2;
    @apply -vertical-30% mx-[1px] px-[6px] py-[0.5px];
    @apply bg-gray-200 text-slate-900;
    @apply no-underline! hover:no-underline!;
    @apply dark:bg-gray-700/80 dark:text-gray-300;
  }

  /**TODO: media query */
  .footnote-tooltip {
    @apply absolute bottom-full left-1/2 z-10 mb-[1px] -translate-x-1/2;
    @apply w-max max-w-64 rounded-lg p-3;
    @apply border-[1px] border-solid border-gray-600;
    @apply text-left text-sm leading-5.5 font-normal;
    @apply bg-[var(--vp-sidebar-bg-color)];
    @apply dark:border-gray-500/90;
  }

  .tooltip-arrow {
    @apply absolute -bottom-2 left-1/2 -translate-x-1/2;
    @apply border-6px border-solid;
    @apply border-gray-600 border-x-transparent border-b-transparent;
    @apply bg-[var(--vp-sidebar-bg-color)];
    @apply hidden;
  }

  .tooltip-content {
    @apply break-words whitespace-normal text-[var(--vp-c-text-1)];
  }

  .tooltip-content :deep(p) {
    @apply m-0 p-0 indent-0 break-words;
  }

  .tooltip-fade-enter-active,
  .tooltip-fade-leave-active {
    @apply ease transition duration-300;
  }

  .tooltip-fade-enter-from,
  .tooltip-fade-leave-to {
    @apply translate-y-10px -translate-x-1/2 opacity-0;
  }
</style>
