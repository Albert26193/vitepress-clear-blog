<template>
  <section class="homepage-container">
    <div class="pt-2">
      <h1 class="text">{{ homepageTitle }}</h1>
      <div class="homepage-second-line">
        <div class="homepage-describe">
          <p class="font-700 font-serif">{{ homepageDescription }}</p>
        </div>
        <div
          class="homepage-go"
          role="link"
          tabindex="0"
          @click="handlePagesClick"
          @keydown.enter="handlePagesKeydown"
          @keydown.space.prevent="handlePagesKeydown"
        >
          <span class="i-carbon-arrow-right dark:text-black"></span>
        </div>
      </div>
    </div>

    <div class="home-d3-container">
      <D3FullScreen
        :width="Math.min(width * 0.78, 850)"
        :height="Math.min(width * 0.75, 800)"
        :zoom-level="0.7"
      ></D3FullScreen
    ></div>
  </section>
</template>

<style lang="scss" scoped>
  .homepage-container {
    @apply flex flex-col items-center justify-evenly px-4;
    min-height: calc(100vh - var(--vp-nav-height) - 2rem);
  }

  .homepage-container .text {
    @apply max-w-[580px] text-center;
    @apply text-4xl font-bold;
    @apply text-[var(--main-page-text)];
  }

  .homepage-container .homepage-describe {
    @apply max-w-[620px] text-center;
    @apply text-xl leading-snug;
    @apply text-[var(--vp-c-text-2)];
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .homepage-container .homepage-go {
    @apply relative cursor-pointer overflow-hidden;
    @apply ml-4 flex items-center;
    @apply bg-[var(--main-page-text)] text-white;
    @apply rounded-xl px-4 py-[6px] text-sm font-bold;
    @apply transition-all duration-300;
    @apply dark:bg-gray-300/90;
  }

  .homepage-go:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }

  .homepage-go:after {
    content: '';
    @apply absolute top-0;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 2s infinite linear;
  }

  .homepage-second-line {
    @apply flex items-center justify-center;
    @apply mt-2;
  }

  .home-d3-container {
    @apply border-1 border-solid;
  }
</style>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import { useData } from 'vitepress'
  import { computed } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'
  import type { BlogConfig } from '../../types/types'
  import D3FullScreen from '../d3/D3FullScreen.vue'

  const { site, theme } = useData<BlogConfig>()
  const { width } = useWindowSize()
  const { handleClick: handlePagesClick, handleKeydown: handlePagesKeydown } =
    useClickAble('/pages/')

  const homepageTitle = computed(
    () => theme.value.homepage?.title || site.value.title
  )
  const homepageDescription = computed(
    () => theme.value.homepage?.description || site.value.description
  )
</script>
