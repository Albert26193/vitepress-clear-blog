<template>
  <sup class="footnote-ref">
    <span
      :href="`#fn${props.id}`"
      :id="`fnref${props.id}`"
      class="footnote-badge-link"
      @mouseover="showTooltip = true"
      @mouseleave="showTooltip = true"
    >
      <span class="footnote-badge" :class="props.type">{{ props.text }}</span>
      <Transition name="tooltip-fade">
        <div class="footnote-tooltip" v-if="showTooltip && props.content">
          <div class="tooltip-content" v-html="props.content"></div>
        </div>
      </Transition>
    </span>
  </sup>
</template>

<script setup lang="ts">
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
    },
    // style for footnote badge
    type: {
      type: String,
      default: 'info',
      validator: (value: string) =>
        ['info', 'tip', 'warning', 'danger'].includes(value)
    }
  })
  const showTooltip = ref(false)
</script>

<style scoped>
  .footnote-ref {
    font-size: 1em;
    vertical-align: super;
    line-height: 0;
    position: relative;
  }

  .footnote-badge-link {
    display: inline;
    margin: 0;
    padding: 0;
    text-decoration: none;
    position: relative;
  }

  .footnote-badge {
    display: inline;
    align-items: center;
    font-size: 12px;
    line-height: 18px;
    font-weight: 500;
    border-radius: 8px;
    padding: 0 6px;
    transform: scale(0.85);
    transform-origin: center;
    margin: 0;
    color: #0c0c0c;
    background-color: #afaf90;
  }

  .footnote-badge.tip {
    color: var(--vp-badge-tip-text);
    background-color: var(--vp-badge-tip-bg);
  }

  .footnote-badge.warning {
    color: var(--vp-badge-warning-text);
    background-color: var(--vp-badge-warning-bg);
  }

  .footnote-badge.danger {
    color: var(--vp-badge-danger-text);
    background-color: var(--vp-badge-danger-bg);
  }

  .footnote-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    z-index: 10;
    width: max-content;
    max-width: 300px;
    padding: 10px 12px;
    border-radius: 6px;
    background-color: var(--vp-c-bg-soft);
    box-shadow: var(--vp-shadow-3);
    font-size: 13px;
    line-height: 1.5;
    font-weight: normal;
    text-align: left;
  }

  .footnote-tooltip::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0;
    border-style: solid;
    border-color: var(--vp-c-bg-soft) transparent transparent;
  }

  .tooltip-content {
    color: var(--vp-c-text-1);
    white-space: normal;
  }

  .tooltip-content :deep(p) {
    margin: 0;
    padding: 0;
    text-indent: 0;
  }

  /* 动画效果 */
  .tooltip-fade-enter-active,
  .tooltip-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  .tooltip-fade-enter-from,
  .tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
</style>
