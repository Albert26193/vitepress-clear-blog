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
    @apply inline-flex gap-1 bg-gray-300/90 rounded-md py-[5px] px-2;
    @apply shadow-inner shadow-gray-500/80;
  }

  .btn-group.horizontal {
    @apply flex-row;
  }

  .btn-group.vertical {
    @apply flex-col;
  }

  .btn-item {
    @apply flex items-center p-1 rounded-md transition-all duration-200;
    @apply hover:bg-gray-100/90;
  }

  .btn-item.active {
    @apply bg-white shadow-md drop-shadow shadow-gray-500/90;
  }

  .btn-item.disabled {
    @apply opacity-50 cursor-not-allowed;
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
    @apply bg-gray-200 text-gray-800 rounded whitespace-nowrap opacity-0;
    @apply transition-all duration-200;
  }

  .tooltip-container:hover .tooltip {
    @apply visible opacity-100;
  }
</style>
