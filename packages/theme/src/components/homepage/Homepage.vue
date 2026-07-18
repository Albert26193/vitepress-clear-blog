<template>
  <section class="homepage-container slide-enter-content">
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
        :width="graphWidth"
        :height="graphHeight"
        :zoom-level="graphZoom"
      ></D3FullScreen
    ></div>
  </section>
</template>

<style lang="scss" scoped>
  @use '../../styles/breakpoints' as bp;

  .homepage-container {
    @apply flex flex-col items-center justify-evenly px-4;
    min-height: calc(100vh - var(--vp-nav-height) - 2rem);
    /* dvh tracks the mobile browser's dynamic toolbar so the graph box is not
     * pushed below the visible fold; the vh line above is the fallback. */
    min-height: calc(100dvh - var(--vp-nav-height) - 2rem);

    --enter-animation: homepage-drop;
    --enter-duration: 1.5s;

    /* On compact screens justify-evenly turns leftover height into large gaps
     * that shove the graph toward the fold — keep content grouped instead. */
    @include bp.below('md') {
      justify-content: center;
      gap: 2.5rem;
    }
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

  /* top-down variant of the blog's slide-enter, same silky feel */
  @keyframes homepage-drop {
    0% {
      transform: translateY(-30px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
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
  import { computed, defineAsyncComponent } from 'vue'

  import { useClickAble } from '../../composables/useClickAble'
  import type { BlogConfig } from '../../types/types'

  const D3FullScreen = defineAsyncComponent(
    () => import('../d3/D3FullScreen.vue')
  )

  const { site, theme } = useData<BlogConfig>()
  const { width } = useWindowSize()
  const { handleClick: handlePagesClick, handleKeydown: handlePagesKeydown } =
    useClickAble('/pages/')

  // 768 = the shared `md` breakpoint (see styles/_breakpoints.scss).
  const isCompact = computed(() => width.value < 768)

  // Compact screens get a wider canvas fraction so the graph box uses the
  // available width instead of shrinking with the desktop ratio.
  const graphWidth = computed(() =>
    Math.min(width.value * (isCompact.value ? 0.92 : 0.78), 850)
  )
  const graphHeight = computed(() =>
    Math.min(width.value * (isCompact.value ? 0.88 : 0.75), 800)
  )

  // The force-layout params are tuned for the 850px canvas; scale the initial
  // zoom with the actual canvas so the graph content fits smaller viewBoxes
  // instead of being clipped at the edges.
  const graphZoom = computed(() =>
    Math.min(0.7, Math.max(0.3, 0.7 * (graphWidth.value / 850)))
  )

  const homepageTitle = computed(
    () => theme.value.homepage?.title || site.value.title
  )
  const homepageDescription = computed(
    () => theme.value.homepage?.description || site.value.description
  )
</script>
