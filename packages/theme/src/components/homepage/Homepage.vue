<template>
  <section class="homepage-container">
    <h1 class="text"> Albert's Blog</h1>

    <div class="homepage-second-line">
      <div class="homepage-describe">
        <p class="font-700 font-serif">能纵棹，惯乘流，长江白浪不曾忧</p>
      </div>
      <div class="homepage-go" @click="router.go(withBase('/pages/'))">
        Go
      </div>
    </div>

    <OverallD3 :width="800" :height="800"></OverallD3>
  </section>
</template>

<style lang="scss" scoped>
  .homepage-container {
    @apply flex flex-col items-center;
    @apply mt-6 px-4;
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

  .homepage-container .homepage-go {
    @apply cursor-pointer;
    @apply bg-[var(--main-page-text)] text-white;
    @apply ml-4;
    @apply rounded-md px-4 py-1 text-sm font-bold;
  }

  .homepage-second-line {
    @apply flex items-center justify-center;
    @apply mt-4;
  }
</style>

<script setup lang="ts">
  // import { siteMetadata } from 'virtual:vitepress-analyzer'
  // import { sitePages } from 'virtual:vitepress-analyzer'
  // console.warn('pages', sitePages)
  import { useRouter, withBase } from 'vitepress'

  import OverallD3 from '../common/OverallD3.vue'

  const router = useRouter()
</script>
