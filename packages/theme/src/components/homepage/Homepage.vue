<template>
  <section class="homepage-container">
    <h1 class="text"> Albert's Blog</h1>
    <div class="homepage-second-line">
      <div class="homepage-describe">
        <p class="font-700 font-serif">能纵棹，惯乘流，长江白浪不曾忧</p>
      </div>
      <div class="homepage-go" @click="router.go(withBase('/pages/'))">
        <span class="i-carbon-arrow-right dark:text-black"></span>
      </div>
    </div>

    <D3FullScreen
      :width="Math.min(width * 0.75, 1000)"
      :height="Math.min(width * 0.5, 600)"
      :zoom-level="0.7"
      class="mt-6 border-1 border-solid"
    ></D3FullScreen>
  </section>
</template>

<style lang="scss" scoped>
  .homepage-container {
    @apply flex flex-col items-center;
    @apply mt-10 px-4;
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
    @apply flex items-center;
    @apply bg-[var(--main-page-text)] text-white;
    @apply ml-3 ml-4;
    @apply rounded-xl px-4 py-1 text-sm font-bold;
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
</style>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import { useRouter, withBase } from 'vitepress'

  import D3FullScreen from '../d3/D3FullScreen.vue'

  const router = useRouter()
  const { width, height } = useWindowSize()
</script>
