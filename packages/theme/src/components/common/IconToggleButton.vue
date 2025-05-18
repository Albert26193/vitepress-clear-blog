<template>
  <div class="btn-group" :class="[props.layout, props.size]">
    <button
      v-for="(icon, index) in props.icons"
      :key="index"
      class="btn-item tooltip-container"
      :class="{
        active: props.modelValue === icon.value,
        disabled: icon.disabled
      }"
      :disabled="icon.disabled"
      :aria-label="icon.tooltip"
      :title="icon.tooltip"
      @click="handleClick(icon.value)"
    >
      <span :class="icon.iconClass" class="text-lg" />
      <span class="tooltip" v-if="icon.tooltip">{{ icon.tooltip }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
  import type { ButtonLayout, ButtonSize, IconOption } from '../../types/types'

  const props = withDefaults(
    defineProps<{
      modelValue: string
      icons: IconOption[]
      layout?: ButtonLayout
      size?: ButtonSize
    }>(),
    {
      layout: 'horizontal',
      size: 'md'
    }
  )

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()

  const handleClick = (value: string) => {
    emit('update:modelValue', value)
  }
</script>

<style scoped>
  .btn-group {
    @apply inline-flex gap-1 rounded-md bg-gray-300/90 px-2 py-[5px];
    @apply shadow-inner shadow-gray-500/80;
  }

  .btn-group.horizontal {
    @apply flex-row;
  }

  .btn-group.vertical {
    @apply flex-col;
  }

  .btn-item {
    @apply flex items-center rounded-md p-1 transition-all duration-200;
    @apply hover:bg-gray-100/90;
  }

  .btn-item.active {
    @apply bg-white shadow-md shadow-gray-500/90 drop-shadow;
  }

  .btn-item.disabled {
    @apply cursor-not-allowed opacity-50;
  }

  /* Size variants */
  .btn-group.sm .btn-item {
    @apply p-0.5 text-sm;
  }

  .btn-group.lg .btn-item {
    @apply p-2 text-xl;
  }

  .tooltip-container {
    @apply relative;
  }

  .tooltip {
    @apply invisible absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs;
    @apply whitespace-nowrap rounded bg-gray-200 text-gray-800 opacity-0;
    @apply transition-all duration-200;
  }

  .tooltip-container:hover .tooltip {
    @apply visible opacity-100;
  }
</style>
