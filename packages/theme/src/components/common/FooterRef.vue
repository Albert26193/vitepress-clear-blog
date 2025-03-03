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
    @apply text-base leading-0 relative;
    @apply ml-[1px];
    /* @apply vertical-super; */
  }

  .footnote-badge-link {
    @apply inline mt-0 p-0 no-underline relative;
    @apply no-underline hover:no-underline!;
  }

  .footnote-badge {
    @apply inline items-center text-xs leading-2 font-500 rounded-md;
    @apply px-[6px] mx-[1px] py-[0.5px];
    @apply text-slate-900 bg-sky-200/50;
  }

  /**TODO: media query */
  .footnote-tooltip {
    @apply absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10;
    @apply w-max max-w-64 p-3 rounded-lg;
    @apply bg-gray-100 border-[1.5px] border-solid border-[var(--vp-c-brand)];
    @apply text-sm leading-5.5 font-normal text-left;
  }

  .tooltip-arrow {
    @apply absolute bottom--12px left-1/2 -translate-x-1/2;
    @apply border-6px border-solid;
    @apply border-t-[var(--vp-c-brand)] border-x-transparent border-b-transparent;
  }

  .tooltip-content {
    @apply text-[var(--vp-c-text-1)] whitespace-normal break-words;
  }

  .tooltip-content :deep(p) {
    @apply m-0 p-0 indent-0 break-words;
  }

  .tooltip-fade-enter-active,
  .tooltip-fade-leave-active {
    @apply transition duration-300 ease;
  }

  .tooltip-fade-enter-from,
  .tooltip-fade-leave-to {
    @apply opacity-0 -translate-x-1/2 translate-y-10px;
  }
</style>
