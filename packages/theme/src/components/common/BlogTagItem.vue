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
    :role="href ? 'link' : 'button'"
    @keydown.enter.stop="handleKeydown"
    @keydown.space.prevent.stop="handleKeydown"
    @click.stop="handleClick"
  >
    <slot>{{ text }}</slot>
    <span v-if="count !== undefined" class="count">{{ count }}</span>
  </span>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'

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

  const tagStyle = computed(() => ({
    '--bv-tag-py': `${props.py * 0.25}rem`,
    '--bv-tag-px': `${props.px * 0.25}rem`,
    '--bv-tag-font-size': `${props.fontSize}px`
  }))

  const { handleClick: navigate, handleKeydown: navigateWithKeyboard } =
    useClickAble(() => props.href, {
      onClick: () => emit('click')
    })

  function handleClick() {
    if (!props.clickable) return
    navigate()
  }

  function handleKeydown() {
    if (!props.clickable) return
    navigateWithKeyboard()
  }
</script>

<style scoped>
  /* Text colors below use plain CSS instead of `text-[var(...)]` utilities:
   * consumers build this source with their own UnoCSS version, and bracketed
   * var() values in `text-[...]` are resolved inconsistently across 66.x
   * releases (some silently generate no CSS), leaving tags black. */
  .blog-tag {
    @apply inline-flex shrink-0 cursor-default items-center rounded-full whitespace-nowrap;
    @apply no-underline;
    color: var(--vp-c-text-1);
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
    color: var(--vp-c-brand);
  }

  .bordered.clickable:hover {
    @apply border-1 border-solid border-[var(--vp-c-brand)];
  }

  .blog-tag.clickable:hover .count {
    color: var(--tag-hover-color, var(--vp-c-brand));
  }

  .blog-tag.active {
    @apply border-1 border-solid border-[var(--vp-c-brand)];
    color: var(--vp-c-brand);
    box-shadow: 0 0 0 0.5px var(--vp-c-brand);
  }

  .count {
    @apply ml-1;
    color: var(--vp-c-brand);
  }

  .blog-tag.active .count {
    color: inherit;
  }
</style>
