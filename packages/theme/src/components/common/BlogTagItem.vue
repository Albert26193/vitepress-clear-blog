<template>
  <span
    class="blog-tag"
    :class="[
      active && 'active',
      clickable && 'clickable',
      bordered && 'bordered'
    ]"
    :style="tagStyle"
    :tabindex="clickable ? 0 : undefined"
    role="button"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    @click.stop="handleClick"
  >
    <slot>{{ text }}</slot>
    <span v-if="count !== undefined" class="count">{{ count }}</span>
  </span>
</template>

<script lang="ts" setup>
  import { useRouter, withBase } from 'vitepress'
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      text?: string
      href?: string
      active?: boolean
      clickable?: boolean
      count?: number
      px?: number
      py?: number
      fontSize?: number
      bordered?: boolean
    }>(),
    {
      clickable: true,
      px: 2,
      py: 1,
      fontSize: 11
    }
  )

  const emit = defineEmits<{ click: [] }>()
  const router = useRouter()

  const tagStyle = computed(() => ({
    '--bv-tag-py': `${props.py * 0.25}rem`,
    '--bv-tag-px': `${props.px * 0.25}rem`,
    '--bv-tag-font-size': `${props.fontSize}px`
  }))

  function handleClick() {
    if (!props.clickable) return
    emit('click')
    if (props.href) {
      router.go(withBase(props.href))
    }
  }
</script>

<style scoped>
  .blog-tag {
    @apply inline-flex cursor-default items-center rounded-full whitespace-nowrap;
    @apply text-[var(--vp-c-text-1)] no-underline;
    padding: var(--bv-tag-py, 0.25rem) var(--bv-tag-px, 0.5rem);
    font-size: var(--bv-tag-font-size, 11px);
    line-height: 1rem;
  }

  .bordered {
    @apply border-1 border-solid border-[var(--vp-c-text-2)];
  }

  .blog-tag.clickable {
    @apply cursor-pointer;
    transition:
      border-color 200ms,
      color 200ms;
  }

  .blog-tag.clickable:hover {
    @apply text-[var(--vp-c-brand)];
  }

  .bordered.clickable:hover {
    @apply border-1 border-solid border-[var(--vp-c-brand)];
  }

  .blog-tag.clickable:hover .count {
    @apply text-[var(--tag-hover-color,--vp-c-brand)];
  }

  .blog-tag.active {
    @apply border-1 border-solid border-[var(--vp-c-brand)] text-[var(--vp-c-brand)];
    box-shadow: 0 0 0 0.5px var(--vp-c-brand);
  }

  .count {
    @apply ml-1 text-[var(--vp-c-brand)];
  }

  .blog-tag.active .count {
    @apply text-inherit;
  }
</style>
